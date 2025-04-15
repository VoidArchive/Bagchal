export const BOARD_DIMENSIONS = 5;
export const TOTAL_POINTS = BOARD_DIMENSIONS * BOARD_DIMENSIONS;
export const TOTAL_GOATS = 20;
export const TIGER_START_POSITIONS = [0, 4, 20, 24];
export const GOAT_CAPTURE_LIMIT = 5;

export const PLAYER_TYPES = {
	GOAT: 'GOAT',
	TIGER: 'TIGER'
} as const;

export const GAME_PHASES = {
	PLACEMENT: 'PLACEMENT',
	MOVEMENT: 'MOVEMENT'
} as const;

export const SVG_BOARD_SIZE = 500;
export const SVG_POINT_OFFSET = 50;
export const SVG_POINT_DISTANCE = 100;

export const PIECE_RADIUS = {
	TIGER: 15,
	GOAT: 12,
	EMPTY: 8,
	HIGHLIGHT: 10
};

export const PIECE_COLOR = {
	TIGER_START: '#FFA500', // Orange
	TIGER_END: '#FF8C00', // DarkOrange
	GOAT_START: '#1E90FF', // DodgerBlue
	GOAT_END: '#4169E1', // RoyalBlue
	// ... keep others or adjust ...
	EMPTY: '#F5F5DC', // Beige instead of white for empty points?
	VALID_MOVE_TIGER: 'rgba(255, 99, 71, 0.6)', // Semi-transparent Tomato
	VALID_MOVE_GOAT: 'rgba(144, 238, 144, 0.6)' // Semi-transparent LightGreen
};

export const STROKE_COLOR = {
	DEFAULT: 'black',
	SELECTED_TIGER: 'red',
	SELECTED_GOAT: 'lime',
	EMPTY: 'darkgray',
	VALID_MOVE: '#555'
};

export const STROKE_WIDTH = {
	DEFAULT: 2,
	SELECTED: 4,
	EMPTY: 1,
	VALID_MOVE: 1.5
};

export const BOARD_COLOR = '#D2B48C'; // Tan/Wood color
export const LINE_COLOR = '#8B4513'; // Saddle Brown
export const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

// Refine piece colors if needed
