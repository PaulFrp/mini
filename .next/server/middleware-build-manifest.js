self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/index.js"
    ],
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/cards_against_humanity/room": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/cards_against_humanity/room.js"
    ],
    "/make_it_meme": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/make_it_meme.js"
    ],
    "/make_it_meme/room": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/make_it_meme/room.js"
    ],
    "/pb_games": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/pb_games.js"
    ],
    "/pb_games/room": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/pb_games/room.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];