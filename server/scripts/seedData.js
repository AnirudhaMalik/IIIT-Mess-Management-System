require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Import models
const User = require('../src/models/User');
const MessPlan = require('../src/models/MessPlan');
const Subscription = require('../src/models/Subscription');
const QRToken = require('../src/models/QRToken');
const MealAttendance = require('../src/models/MealAttendance');
const Menu = require('../src/models/Menu');
const Transaction = require('../src/models/Transaction');
const Complaint = require('../src/models/Complaint');
const Notification = require('../src/models/Notification');
const Announcement = require('../src/models/Announcement');
const AuditLog = require('../src/models/AuditLog');

const connectDB = require('../src/config/db');

// Helper to normalize date to UTC midnight
const getNormalizedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const runSeed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      MessPlan.deleteMany({}),
      Subscription.deleteMany({}),
      QRToken.deleteMany({}),
      MealAttendance.deleteMany({}),
      Menu.deleteMany({}),
      Transaction.deleteMany({}),
      Complaint.deleteMany({}),
      Notification.deleteMany({}),
      Announcement.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    console.log('✓ All collections cleared successfully.');

    // 1. Create Admin Account (plain password - model's pre-save hook will hash it)
    console.log('Creating Admin Account...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@iiitbbs.ac.in',
      password: 'Admin@123',
      role: 'admin',
      phone: '9876543210',
      hostel: 'Faculty Quarter A-1',
      roomNumber: '101',
      isActive: true
    });
    console.log(`✓ Admin created: ${admin.email}`);

    // 2. Create 10 Students (plain password - model's pre-save hook will hash it)
    console.log('Creating 10 Student accounts...');

    const studentData = [
      {
        name: 'Aarav Sharma',
        email: '22cs001@iiitbbs.ac.in',
        studentId: '22CS001',
        phone: '9876500001',
        hostel: 'Kalinga Boys Hostel',
        roomNumber: 'K-201'
      },
      {
        name: 'Priya Nayak',
        email: '22cs002@iiitbbs.ac.in',
        studentId: '22CS002',
        phone: '9876500002',
        hostel: 'Vindhya Girls Hostel',
        roomNumber: 'V-104'
      },
      {
        name: 'Rohan Senapati',
        email: '22cs003@iiitbbs.ac.in',
        studentId: '22CS003',
        phone: '9876500003',
        hostel: 'Nilgiri Boys Hostel',
        roomNumber: 'N-312'
      },
      {
        name: 'Sneha Mohanty',
        email: '22cs004@iiitbbs.ac.in',
        studentId: '22CS004',
        phone: '9876500004',
        hostel: 'Vindhya Girls Hostel',
        roomNumber: 'V-208'
      },
      {
        name: 'Ayush Patra',
        email: '22cs005@iiitbbs.ac.in',
        studentId: '22CS005',
        phone: '9876500005',
        hostel: 'Kalinga Boys Hostel',
        roomNumber: 'K-105'
      },
      {
        name: 'Ananya Dash',
        email: '22cs006@iiitbbs.ac.in',
        studentId: '22CS006',
        phone: '9876500006',
        hostel: 'Vindhya Girls Hostel',
        roomNumber: 'V-315'
      },
      {
        name: 'Debasish Mishra',
        email: '22cs007@iiitbbs.ac.in',
        studentId: '22CS007',
        phone: '9876500007',
        hostel: 'Nilgiri Boys Hostel',
        roomNumber: 'N-102'
      },
      {
        name: 'Subhashree Rout',
        email: '22cs008@iiitbbs.ac.in',
        studentId: '22CS008',
        phone: '9876500008',
        hostel: 'Vindhya Girls Hostel',
        roomNumber: 'V-112'
      },
      {
        name: 'Tanmay Tripathy',
        email: '22cs009@iiitbbs.ac.in',
        studentId: '22CS009',
        phone: '9876500009',
        hostel: 'Kalinga Boys Hostel',
        roomNumber: 'K-304'
      },
      {
        name: 'Siddharth Sahoo',
        email: '22cs010@iiitbbs.ac.in',
        studentId: '22CS010',
        phone: '9876500010',
        hostel: 'Nilgiri Boys Hostel',
        roomNumber: 'N-205'
      }
    ];

    const students = [];
    for (const s of studentData) {
      const student = await User.create({
        ...s,
        password: 'Student@123',
        role: 'student',
        isActive: true
      });
      students.push(student);
    }
    console.log(`✓ ${students.length} students created.`);

    // 3. Create Mess Plans
    console.log('Creating 3 Mess Plans...');
    const plans = await MessPlan.create([
      {
        name: 'Monthly Basic',
        description: 'Standard plan covering Breakfast, Lunch, and Dinner with healthy daily nutrition.',
        duration: 30,
        price: 2800,
        mealTypes: ['breakfast', 'lunch', 'dinner'],
        features: [
          '3 Healthy Meals Daily',
          'Veg & Non-Veg Weekend Specials',
          'Leave Mess Rebate Option',
          'Digital QR Access'
        ],
        isActive: true
      },
      {
        name: 'Monthly Full',
        description: 'Comprehensive mess plan including Evening Snacks & Tea/Coffee alongside all 3 main meals.',
        duration: 30,
        price: 3500,
        mealTypes: ['breakfast', 'lunch', 'snacks', 'dinner'],
        features: [
          'All 4 Meals Included',
          'Evening Snacks with Tea & Coffee',
          'Sunday Grand Feast Buffet',
          'Priority Counter Service'
        ],
        isActive: true
      },
      {
        name: 'Semester Plan',
        description: 'Semester-long comprehensive mess plan with complete meal coverage and high savings discount.',
        duration: 150,
        price: 15000,
        mealTypes: ['breakfast', 'lunch', 'snacks', 'dinner'],
        features: [
          'Full Semester 150 Days Coverage',
          'All 4 Meals Every Single Day',
          'Festival & Tech Fest Banquets Included',
          'Maximum Discount & No Rate Hikes'
        ],
        isActive: true
      }
    ]);
    console.log(`✓ ${plans.length} mess plans created.`);

    // 4. Create 8 Transactions
    console.log('Creating Transactions...');
    const transactions = [];
    const paymentMethods = ['upi', 'card', 'netbanking'];

    for (let i = 0; i < 8; i++) {
      const student = students[i];
      const plan = plans[i % plans.length];
      const method = paymentMethods[i % paymentMethods.length];

      let status = 'success';
      if (i === 6) status = 'failed';
      if (i === 7) status = 'cancelled';

      const txn = await Transaction.create({
        student: student._id,
        plan: plan._id,
        amount: plan.price,
        paymentMethod: method,
        status,
        transactionId: `TXN${Date.now() - (8 - i) * 86400000}${1000 + i}`,
        gatewayRef: status === 'success' ? `GW_${method.toUpperCase()}_${Date.now() - i * 10000}` : null,
        notes: `Mess subscription payment for ${plan.name}`,
        isDemo: true,
        createdAt: new Date(Date.now() - (10 - i) * 86400000)
      });
      transactions.push(txn);
    }
    console.log(`✓ ${transactions.length} transactions created.`);

    // 5. Create 8 Subscriptions for 8 Students
    console.log('Creating Subscriptions...');
    const subscriptions = [];
    const now = new Date();

    for (let i = 0; i < 8; i++) {
      const student = students[i];
      const plan = plans[i % plans.length];
      const txn = transactions[i];

      const startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // started 5 days ago
      const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

      const subStatus = i < 6 ? 'active' : i === 6 ? 'pending' : 'expired';

      const subscription = await Subscription.create({
        student: student._id,
        plan: plan._id,
        status: subStatus,
        startDate: subStatus === 'pending' ? null : startDate,
        endDate: subStatus === 'pending' ? null : endDate,
        paymentRef: txn._id,
        autoRenew: i % 2 === 0
      });

      // Link transaction to subscription
      txn.subscription = subscription._id;
      await txn.save();

      subscriptions.push(subscription);
    }
    console.log(`✓ ${subscriptions.length} subscriptions created.`);

    // 6. Create 7 Days of Menus (Today - 3 to Today + 3)
    console.log('Creating 7 Days of Menus...');
    const menuTemplates = [
      {
        breakfast: {
          items: [
            { name: 'Idli Sambar', description: 'Steamed rice cakes with spiced lentil soup', isVeg: true },
            { name: 'Medovada & Coconut Chutney', description: 'Crispy lentil donuts', isVeg: true },
            { name: 'Boiled Eggs / Banana', description: 'Choice of protein', isVeg: false },
            { name: 'Tea / Coffee', description: 'Fresh hot beverage', isVeg: true }
          ],
          timing: '7:30 AM - 9:30 AM'
        },
        lunch: {
          items: [
            { name: 'Jeera Rice', description: 'Cumin flavored basmati rice', isVeg: true },
            { name: 'Dal Tadka', description: 'Yellow lentils tempered with garlic and ghee', isVeg: true },
            { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', isVeg: true },
            { name: 'Tandoori Roti', description: 'Fresh wheat flatbread', isVeg: true },
            { name: 'Cucumber Raita & Salad', description: 'Chilled spiced yogurt', isVeg: true }
          ],
          timing: '12:30 PM - 2:30 PM'
        },
        snacks: {
          items: [
            { name: 'Vegetable Cutlet', description: 'Crisp crumbed potato vegetable cutlet', isVeg: true },
            { name: 'Green Mint Chutney', description: 'Spicy tangy dip', isVeg: true },
            { name: 'Masala Chai', description: 'Ginger cardamom tea', isVeg: true }
          ],
          timing: '5:00 PM - 6:30 PM'
        },
        dinner: {
          items: [
            { name: 'Steamed Rice', description: 'Long grain rice', isVeg: true },
            { name: 'Mixed Veg Sabzi', description: 'Seasonal vegetables sauteed with spices', isVeg: true },
            { name: 'Odia Dalma', description: 'Traditional Odia lentil and vegetable stew', isVeg: true },
            { name: 'Butter Phulka', description: 'Puffed whole wheat bread', isVeg: true },
            { name: 'Gulab Jamun', description: 'Warm sweet milk dumplings', isVeg: true }
          ],
          timing: '7:30 PM - 9:30 PM'
        }
      },
      {
        breakfast: {
          items: [
            { name: 'Aloo Paratha', description: 'Whole wheat flatbread stuffed with spiced potato', isVeg: true },
            { name: 'Fresh Curd & Pickle', description: 'Accompaniment', isVeg: true },
            { name: 'Seasonal Fruit', description: 'Fresh sliced papaya/apple', isVeg: true },
            { name: 'Tea / Milk', description: 'Choice of beverage', isVeg: true }
          ],
          timing: '7:30 AM - 9:30 AM'
        },
        lunch: {
          items: [
            { name: 'Steamed Rice', description: 'Hot steamed rice', isVeg: true },
            { name: 'Dal Makhani', description: 'Slow cooked black lentils with cream and butter', isVeg: true },
            { name: 'Aloo Gobi Matar', description: 'Potato, cauliflower and peas curry', isVeg: true },
            { name: 'Egg Curry / Paneer Bhurji', description: 'Choice of egg or paneer', isVeg: false },
            { name: 'Chapati & Roasted Papad', description: 'Accompaniments', isVeg: true }
          ],
          timing: '12:30 PM - 2:30 PM'
        },
        snacks: {
          items: [
            { name: 'Poha with Sev', description: 'Flattened rice tossed with onions, peanuts and mustard', isVeg: true },
            { name: 'Hot Filter Coffee', description: 'Brewed coffee', isVeg: true }
          ],
          timing: '5:00 PM - 6:30 PM'
        },
        dinner: {
          items: [
            { name: 'Fried Rice', description: 'Indo-Chinese vegetable fried rice', isVeg: true },
            { name: 'Chilli Paneer Gravy', description: 'Crispy paneer in soy-chilli gravy', isVeg: true },
            { name: 'Sweet Corn Soup', description: 'Warm comforting soup', isVeg: true },
            { name: 'Ice Cream Cup', description: 'Vanilla / Chocolate', isVeg: true }
          ],
          timing: '7:30 PM - 9:30 PM',
          isSpecial: true,
          specialNote: 'Indo-Chinese Special Dinner'
        }
      }
    ];

    for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
      const menuDate = getNormalizedDate(dayOffset);
      const template = menuTemplates[Math.abs(dayOffset) % menuTemplates.length];

      for (const mealType of ['breakfast', 'lunch', 'snacks', 'dinner']) {
        const mealData = template[mealType];
        await Menu.create({
          date: menuDate,
          mealType,
          items: mealData.items,
          timing: mealData.timing,
          isSpecial: mealData.isSpecial || false,
          specialNote: mealData.specialNote || '',
          createdBy: admin._id
        });
      }
    }
    console.log('✓ 28 Menu records created across 7 days.');

    // 7. Create 30 Meal Attendance Records across last 7 days
    console.log('Creating 30 Meal Attendance records...');
    const mealAttendanceRecords = [];
    let count = 0;

    for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
      const attDate = getNormalizedDate(dayOffset);

      for (let sIndex = 0; sIndex < 5; sIndex++) {
        if (count >= 30) break;
        const student = students[sIndex];
        const sub = subscriptions[sIndex];
        const mealType = sIndex % 2 === 0 ? 'lunch' : 'dinner';

        const att = await MealAttendance.create({
          student: student._id,
          subscription: sub._id,
          date: attDate,
          mealType,
          verifiedBy: admin._id,
          scanTime: new Date(attDate.getTime() + (mealType === 'lunch' ? 13 : 20) * 3600000),
          status: 'success',
          notes: 'Regular QR Scan'
        });
        mealAttendanceRecords.push(att);
        count++;
      }
    }
    console.log(`✓ ${mealAttendanceRecords.length} meal attendance records created.`);

    // 8. Create 6 Complaints
    console.log('Creating 6 Complaints in various statuses...');
    const complaintData = [
      {
        student: students[0]._id,
        category: 'food_quality',
        description: 'The chapattis served during dinner on Tuesday were undercooked and dry. Kindly ensure properly cooked soft rotis.',
        status: 'resolved',
        adminResponse: 'We have instructed the kitchen staff to ensure dough is well-rested and tandoor temperature is maintained.',
        resolvedAt: new Date(Date.now() - 2 * 86400000),
        assignedTo: admin._id
      },
      {
        student: students[1]._id,
        category: 'hygiene',
        description: 'Water dispenser near the dining hall entrance was leaking and floor was slippery. Needs immediate maintenance.',
        status: 'under_review',
        adminNote: 'Reported to campus housekeeping and plumbing team.',
        assignedTo: admin._id
      },
      {
        student: students[2]._id,
        category: 'quantity',
        description: 'Special sweet dish got over before 9:00 PM last Sunday. Second batch students could not get any.',
        status: 'pending'
      },
      {
        student: students[3]._id,
        category: 'staff_behaviour',
        description: 'Counter staff was polite and handled heavy queue during lunch hour very patiently.',
        status: 'resolved',
        adminResponse: 'Thank you for the appreciation. The staff member has been commended.',
        resolvedAt: new Date(Date.now() - 1 * 86400000),
        assignedTo: admin._id
      },
      {
        student: students[4]._id,
        category: 'menu',
        description: 'Requesting inclusion of Sprouts and Boiled Eggs during weekday breakfast for students who go to the gym.',
        status: 'under_review',
        assignedTo: admin._id
      },
      {
        student: students[5]._id,
        category: 'other',
        description: 'QR Scanner at Counter 2 had difficulty reading screens with low brightness. Please upgrade scanner lens.',
        status: 'rejected',
        adminResponse: 'Please increase your mobile phone brightness to 80% while presenting QR token at the scanner.',
        resolvedAt: new Date(Date.now() - 3 * 86400000),
        assignedTo: admin._id
      }
    ];

    for (const c of complaintData) {
      await Complaint.create(c);
    }
    console.log('✓ 6 Complaints created.');

    // 9. Create 5 Notifications per student (50 notifications)
    console.log('Creating 50 Notifications (5 per student)...');
    const notifications = [];
    for (const s of students) {
      notifications.push(
        {
          recipient: s._id,
          title: 'Welcome to Mess Portal',
          message: 'Welcome to IIIT Bhubaneswar Mess Management System! You can view daily menus, recharge plans, and scan your QR code at meals.',
          type: 'system',
          isRead: true,
          createdAt: new Date(Date.now() - 10 * 86400000)
        },
        {
          recipient: s._id,
          title: 'Subscription Activated',
          message: 'Your mess subscription has been approved and activated. Enjoy hygienic and healthy dining.',
          type: 'subscription',
          isRead: true,
          createdAt: new Date(Date.now() - 5 * 86400000)
        },
        {
          recipient: s._id,
          title: 'Payment Receipt',
          message: 'Your recent mess fee payment was processed successfully. Transaction receipt has been generated.',
          type: 'payment',
          isRead: false,
          createdAt: new Date(Date.now() - 4 * 86400000)
        },
        {
          recipient: s._id,
          title: 'Sunday Feast Announcement',
          message: 'Grand feast this Sunday on occasion of Tech Fest celebrations from 12:30 PM to 3:00 PM.',
          type: 'announcement',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 86400000)
        },
        {
          recipient: s._id,
          title: 'Meal Timings Reminder',
          message: 'Dinner service concludes strictly at 9:30 PM. Please scan your QR code on time to avoid inconvenience.',
          type: 'reminder',
          isRead: false,
          createdAt: new Date(Date.now() - 1 * 86400000)
        }
      );
    }
    await Notification.insertMany(notifications);
    console.log(`✓ ${notifications.length} notifications created.`);

    // 10. Create 3 Announcements
    console.log('Creating 3 Announcements...');
    await Announcement.create([
      {
        title: 'Special Feast on Sunday for Annual Tech Fest Advaita',
        content: 'There will be a special 5-course feast on Sunday during lunch hours for all registered mess subscribers. Special desserts including Rasagola and Ice Cream will be served.',
        targetAudience: 'all',
        createdBy: admin._id,
        isPublished: true,
        publishedAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        title: 'Mess Committee Student Feedback Session',
        content: 'All students are invited to the open-house discussion with the Mess Committee on Wednesday at 5:30 PM in the Multi-Purpose Hall to discuss menu updates and food quality suggestions.',
        targetAudience: 'students',
        createdBy: admin._id,
        isPublished: true,
        publishedAt: new Date(Date.now() - 1 * 86400000)
      },
      {
        title: 'Holiday Mess Timings Notice for Diwali',
        content: 'Mess service hours during Diwali holidays will follow Sunday timings. Students remaining in hostels are requested to register their presence on the mess portal.',
        targetAudience: 'all',
        createdBy: admin._id,
        isPublished: false,
        publishedAt: null
      }
    ]);
    console.log('✓ 3 Announcements created.');

    // 11. Create QR Tokens for all 10 students (30 day expiry for demo)
    console.log('Generating QR Tokens for all students...');
    for (const s of students) {
      await QRToken.create({
        student: s._id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      });
    }
    console.log(`✓ QR Tokens generated for ${students.length} students.`);

    console.log('\n======================================================');
    console.log('  SEED DATA GENERATION COMPLETED SUCCESSFULLY!        ');
    console.log('======================================================');
    console.log('Admin Account:');
    console.log('  Email:    admin@iiitbbs.ac.in');
    console.log('  Password: Admin@123');
    console.log('Student Accounts:');
    console.log('  Sample Email: 22cs001@iiitbbs.ac.in');
    console.log('  Password:     Student@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed script error:', error);
    process.exit(1);
  }
};

runSeed();
