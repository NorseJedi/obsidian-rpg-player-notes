export interface ReplacementToken {
	token: string; // e.g. "{DATE}"
	description: string; // for table
	replace: () => string; // function to generate replacement
}

export const REPLACEMENT_TOKENS: ReplacementToken[] = [
	{
		token: '{DATE}',
		description: "Today's date as YYYY-MM-DD",
		replace: () => new Date().toISOString().split('T')[0]
	},
	{
		token: '{YEAR}',
		description: 'Current year (4 digits)',
		replace: () => String(new Date().getFullYear())
	},
	{
		token: '{MONTH}',
		description: 'Numeric current month (no leading 0)',
		replace: () => String(new Date().getMonth() + 1)
	},
	{
		token: '{DAY}',
		description: 'Numeric current day (no leading 0)',
		replace: () => String(new Date().getDate())
	},
	{
		token: '{DAYNAME}',
		description: 'Name of the current day in English',
		replace: () => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
	},
	{
		token: '{WEEK}',
		description: 'Current week number according to ISO-8601',
		replace: () => getWeekNumber(new Date())
	}
];

const getWeekNumber = (date: Date): string => {
	// Copying date so the original date won't be modified
	const tempDate = new Date(date.valueOf());

	// ISO week date weeks start on Monday, so correct the day number
	const dayNum = (date.getDay() + 6) % 7;

	// Set the target to the nearest Thursday (current date + 4 - the current day number)
	tempDate.setDate(tempDate.getDate() - dayNum + 3);

	// ISO 8601 week number of the year for this date
	const firstThursday = tempDate.valueOf();

	// Set the target to the first day of the year
	// First set the target to January 1st
	tempDate.setMonth(0, 1);

	// If this is not a Thursday, set the target to the next Thursday
	if (tempDate.getDay() !== 4) {
		tempDate.setMonth(0, 1 + ((4 - tempDate.getDay() + 7) % 7));
	}

	// The weeknumber is the number of weeks between the first Thursday of the year
	// and the Thursday in the target week
	return (1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000)).toString(); // 604800000 = number of milliseconds in a week
};
