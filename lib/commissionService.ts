// lib/commissionService.ts
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Commission from '@/models/Commission';
import Notification from '@/models/Notification';
import { pusherServer } from '@/lib/pusher';

export async function processOrderCompletion(orderId: string): Promise<void> {
  await connectDB();

  const order: any = await Order.findOne({ _id: orderId })
    .populate({
      path: 'items.product',
      populate: { path: 'category', select: 'name' },
      select: 'name category',
    })
    .lean();

  if (!order) {
    console.error(`processOrderCompletion failed: Order ${orderId} not found.`);
    return;
  }

  if (order.commissionCalculated) {
    console.log(`Skipping order ${orderId}: commission/notification already processed.`);
    return;
  }

  const teller: any = await User.findById(order.teller).lean();
  if (!teller) {
    console.error(`processOrderCompletion failed: Teller ${order.teller} for order ${orderId} not found.`);
    await Order.updateOne({ _id: order._id }, { $set: { commissionCalculated: true } });
    return;
  }

  let totalCommissionForOrder = 0;

  for (const item of order.items) {
    const product = item.product;
    if (!product || !product.category) {
      console.warn(`Skipping item in order ${orderId}: Product or category info missing for item ID ${item.product?._id || item.product}.`);
      continue;
    }

    const categoryName: string = product.category.name.trim().toLowerCase();
    let rate = 0;

    if (categoryName.includes('packaging')) {
      rate = 0;
    } else if (categoryName.includes('bag') || categoryName.includes('handbag')) {
      rate = 30;
    } else if (categoryName.includes('innerwear')) {
      rate = 50;
    } else {
      rate = 100;
    }

    if (rate > 0 && !teller.isAdmin) {
      const amount = item.quantity * rate;
      totalCommissionForOrder += amount;

      await Commission.create({
        teller: teller._id,
        order: order._id,
        amount,
        category: product.category.name,
        month: new Date(order.createdAt).getMonth() + 1,
        year: new Date(order.createdAt).getFullYear(),
        details: {
          productId: product._id,
          productName: product.name,
          variantName: item.variantName || null,
          quantity: item.quantity,
        },
      });
    }
  }

  if (totalCommissionForOrder > 0 || teller.isAdmin) {
    const formattedAmount = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(order.totalAmount);
    const formattedCommission = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalCommissionForOrder);

    const userMessage = teller.isAdmin
      ? `You created an order of ${formattedAmount}.`
      : `You created an order of ${formattedAmount} and earned ${formattedCommission} in commission.`;

    const userNotification = await Notification.create({ user: teller._id, message: userMessage, link: `/history` });
    await pusherServer.trigger(`private-user-${teller._id.toString()}`, 'new-notification', userNotification.toObject());

    const adminMessage = `${teller.name} created an order of ${formattedAmount}. Commission: ${formattedCommission}.`;
    const admins: any[] = await User.find({ isAdmin: true, _id: { $ne: teller._id } });
    if (admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: adminMessage,
        link: `/admin/orders/${order._id}`,
      }));
      await Notification.insertMany(adminNotifications);
      const adminChannels = admins.map((admin) => `private-user-${admin._id.toString()}`);
      await pusherServer.trigger(adminChannels, 'new-notification', { message: adminMessage, link: `/admin/orders/${order._id}` });
    }
  }

  await Order.updateOne({ _id: order._id }, { $set: { commissionCalculated: true } });
  console.log(`Successfully processed commission for order ${orderId}.`);
}
