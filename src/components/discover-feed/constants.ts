export const TRIPS_URL = 'https://ik.imagekit.io/a16xyz/crew/travel-bundles.json';

// A request that hangs on a weak network ends in the error state instead of loading forever.
export const FETCH_TIMEOUT_MS = 15_000;

// Cards are about 380pt tall, so 6 fills the first screen with some to spare on any phone.
export const FEED_BATCH_SIZE = 6;

// Screens of cards kept built: the visible one plus 2 above and 2 below (FlatList's default
// is 21). Fewer built cards means less memory and less to rebuild.
export const FEED_WINDOW_SIZE = 5;

// Enough skeleton cards to fill the first screen below the header.
export const SKELETON_COUNT = 2;
