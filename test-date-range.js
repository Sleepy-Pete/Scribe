const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = now.getDate();
const startOfDay = new Date(year, month, day, 0, 0, 0, 0).getTime();
const endOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();

console.log('Current time:', now.toLocaleString());
console.log('Start of day:', new Date(startOfDay).toLocaleString(), '(' + startOfDay + ')');
console.log('End of day:', new Date(endOfDay).toLocaleString(), '(' + endOfDay + ')');
console.log('');
console.log('OLD Query (WRONG):');
console.log('  SELECT COUNT(*) FROM events WHERE start_ts >= ' + startOfDay + ' AND end_ts <= ' + endOfDay);
console.log('');
console.log('NEW Query (CORRECT):');
console.log('  SELECT COUNT(*) FROM events WHERE start_ts >= ' + startOfDay + ' AND start_ts < ' + endOfDay);

