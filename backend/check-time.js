// Quick time checker
const dayjs = require('dayjs');

const now = dayjs();
console.log('='.repeat(50));
console.log('CURRENT TIME:', now.format('YYYY-MM-DD HH:mm'));
console.log('='.repeat(50));

// Calculate times for testing
const in30min = now.add(30, 'minute');
const in1hour = now.add(1, 'hour');
const in90min = now.add(90, 'minute');
const in2hours = now.add(2, 'hour');

console.log('\n📋 BOOKING TIMES FOR TESTING:\n');
console.log('For URGENT reminder (< 1 hour):');
console.log(`  Book for: ${in30min.format('HH:mm')} (30 minutes from now)`);
console.log(`  Book for: ${in1hour.format('HH:mm')} (1 hour from now)`);

console.log('\nFor NORMAL reminder (1-2 hours):');
console.log(`  Book for: ${in90min.format('HH:mm')} (1.5 hours from now)`);

console.log('\nFor NO reminder (> 2 hours):');
console.log(`  Book for: ${in2hours.format('HH:mm')} (2+ hours from now)`);

console.log('\n' + '='.repeat(50));
console.log('Use these times when creating your booking!');
console.log('='.repeat(50));
