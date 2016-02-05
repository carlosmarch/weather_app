
/* This object manages environment conditions.
 * Maps iconText with a function that creates environment
 * @thanks to @tbranyen
 * https://gist.github.com/tbranyen/62d974681dea8ee0caa1
 */

var iconsData = {
  "200": {
    "label": "thunderstorm with light rain",
    "icon": "storm-showers",
    "function": [
      {
        "name": "createRain",
        "num": 80
      },
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createThunder",
        "num": 3
      }
    ]
  },

  "201": {
    "label": "thunderstorm with rain",
    "icon": "storm-showers",
    "function": [
      {
        "name": "createRain",
        "num": 100
      },
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createThunder",
        "num": 3
      }
    ]
  },

  "202": {
    "label": "thunderstorm with heavy rain",
    "icon": "storm-showers",
    "function": [
      {
        "name": "createRain",
        "num": 130
      },
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createThunder",
        "num": 4
      }
    ]
  },

  "210": {
    "label": "light thunderstorm",
    "icon": "storm-showers",
    "function": [
      {
        "name": "createThunder",
        "num": 1
      },
      {
        "name": "createClouds",
        "num": 10
      }
    ]
  },

  "211": {
    "label": "thunderstorm",
    "icon": "thunderstorm",
    "function": [
      {
        "name": "createThunder",
        "num": 3
      },
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "212": {
    "label": "heavy thunderstorm",
    "icon": "thunderstorm",
    "function": [
      {
        "name": "createThunder",
        "num": 4
      },
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "221": {
    "label": "ragged thunderstorm",
    "icon": "thunderstorm",
    "function": [
      {
        "name": "createThunder",
        "num": 3
      },
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "230": {
    "label": "thunderstorm with light drizzle",
    "icon": "storm-showers",
    "function": [
      {
        "name": "createRain",
        "num": 40
      },
      {
        "name": "createThunder",
        "num": 3
      },
      {
        "name": "createClouds",
        "num": 10
      }
    ]
  },

  "231": {
    "label": "thunderstorm with drizzle",
    "icon": "storm-showers",
    "function": [
      {
        "name": "createRain",
        "num": 80
      },
      {
        "name": "createThunder",
        "num": 3
      },
      {
        "name": "createClouds",
        "num": 10
      }
    ]
  },

  "232": {
    "label": "thunderstorm with heavy drizzle",
    "icon": "storm-showers",
    "function": [
      {
        "name": "createRain",
        "num": 100
      },
      {
        "name": "createThunder",
        "num": 3
      },
      {
        "name": "createClouds",
        "num": 10
      }
    ]
  },

  "300": {
    "label": "light intensity drizzle",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 20
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "301": {
    "label": "drizzle",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 40
      },
      {
        "name": "createClouds",
        "num": 8
      }
    ]
  },

  "302": {
    "label": "heavy intensity drizzle",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 60
      },
      {
        "name": "createClouds",
        "num": 9
      }
    ]
  },

  "310": {
    "label": "light intensity drizzle rain",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 40
      }
      ,
      {
        "name": "createClouds",
        "num": 8
      }
    ]
  },

  "311": {
    "label": "drizzle rain",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 40
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "312": {
    "label": "heavy intensity drizzle rain",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 60
      },
      {
        "name": "createClouds",
        "num": 8
      }
    ]
  },

  "313": {
    "label": "shower rain and drizzle",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 60
      },
      {
        "name": "createClouds",
        "num": 8
      }
    ]
  },

  "314": {
    "label": "heavy shower rain and drizzle",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 100
      },
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "321": {
    "label": "shower drizzle",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createRain",
        "num": 100
      },
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "500": {
    "label": "light rain",
    "icon": "rain",
    "function": [
      {
        "name": "createRain",
        "num": 40
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "501": {
    "label": "moderate rain",
    "icon": "rain",
    "function": [
      {
        "name": "createRain",
        "num": 60
      },
      {
        "name": "createClouds",
        "num": 8
      }
    ]
  },

  "502": {
    "label": "heavy intensity rain",
    "icon": "rain",
    "function": [
      {
        "name": "createRain",
        "num": 180
      },
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "503": {
    "label": "very heavy rain",
    "icon": "rain",
    "function": [
      {
        "name": "createRain",
        "num": 200
      },
      {
        "name": "createClouds",
        "num": 18
      }
    ]
  },

  "504": {
    "label": "extreme rain",
    "icon": "rain",
    "function": [
      {
        "name": "createRain",
        "num": 250
      },
      {
        "name": "createClouds",
        "num": 20
      }
    ]
  },

  "511": {
    "label": "freezing rain",
    "icon": "rain-mix",
    "function": [
      {
        "name": "createRain",
        "num": 40
      },
      {
        "name": "createClouds",
        "num": 20
      },
      {
        "name": "createSnow",
        "num": 40
      }
    ]
  },

  "520": {
    "label": "light intensity shower rain",
    "icon": "showers",
    "function": [
      {
        "name": "createRain",
        "num": 60
      },
      {
        "name": "createClouds",
        "num": 8
      }
    ]
  },

  "521": {
    "label": "shower rain",
    "icon": "showers",
    "function": [
      {
        "name": "createRain",
        "num": 80
      },
      {
        "name": "createClouds",
        "num": 10
      }
    ]
  },

  "522": {
    "label": "heavy intensity shower rain",
    "icon": "showers",
    "function": [
      {
        "name": "createRain",
        "num": 100
      },
      {
        "name": "createClouds",
        "num": 12
      }
    ]
  },

  "531": {
    "label": "ragged shower rain",
    "icon": "showers",
    "function": [
      {
        "name": "createRain",
        "num": 60
      },
      {
        "name": "createClouds",
        "num": 8
      }
    ]
  },

  "600": {
    "label": "light snow",
    "icon": "snow",
    "function": [
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createSnow",
        "num": 80
      }
    ]
  },

  "601": {
    "label": "snow",
    "icon": "snow",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createSnow",
        "num": 100
      }
    ]
  },

  "602": {
    "label": "heavy snow",
    "icon": "snow",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createSnow",
        "num": 200
      }
    ]
  },

  "611": {
    "label": "sleet",
    "icon": "sleet",
    "function": [
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createSnow",
        "num": 60
      },
      {
        "name": "createRain",
        "num": 40
      }
    ]
  },

  "612": {
    "label": "shower sleet",
    "icon": "sleet",
    "function": [
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createSnow",
        "num": 80
      },
      {
        "name": "createRain",
        "num": 80
      }
    ]
  },

  "615": {
    "label": "light rain and snow",
    "icon": "rain-mix",
    "function": [
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createSnow",
        "num": 80
      },
      {
        "name": "createRain",
        "num": 80
      }
    ]
  },

  "616": {
    "label": "rain and snow",
    "icon": "rain-mix",
    "function": [
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createSnow",
        "num": 120
      },
      {
        "name": "createRain",
        "num": 100
      }
    ]
  },

  "620": {
    "label": "light shower snow",
    "icon": "rain-mix",
    "function": [
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createSnow",
        "num": 60
      },
      {
        "name": "createRain",
        "num": 40
      }
    ]
  },

  "621": {
    "label": "shower snow",
    "icon": "rain-mix",
    "function": [
      {
        "name": "createClouds",
        "num": 10
      },
      {
        "name": "createSnow",
        "num": 60
      },
      {
        "name": "createRain",
        "num": 40
      }
    ]
  },

  "622": {
    "label": "heavy shower snow",
    "icon": "rain-mix",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createSnow",
        "num": 100
      },
      {
        "name": "createRain",
        "num": 80
      }
    ]
  },

  "701": {
    "label": "mist",
    "icon": "sprinkle",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "711": {
    "label": "smoke",
    "icon": "smoke",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 4
      }
    ]
  },

  "721": {
    "label": "haze",
    "icon": "day-haze",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "731": {
    "label": "sand, dust whirls",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "741": {
    "label": "fog",
    "icon": "fog",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "751": {
    "label": "sand",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "761": {
    "label": "dust",
    "icon": "dust",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "762": {
    "label": "volcanic ash",
    "icon": "smog",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "771": {
    "label": "squalls",
    "icon": "day-windy",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "781": {
    "label": "tornado",
    "icon": "tornado",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createFog",
        "num": 5
      }
    ]
  },

  "800": {
    "label": "clear sky",
    "icon": "sunny",
    "function": [
      {
        "name": "its_clear"
      }
    ]
  },

  "801": {
    "label": "few clouds",
    "icon": "cloudy",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "802": {
    "label": "scattered clouds",
    "icon": "cloudy",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "803": {
    "label": "broken clouds",
    "icon": "cloudy",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "804": {
    "label": "overcast clouds",
    "icon": "cloudy",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },


  "900": {
    "label": "tornado",
    "icon": "tornado",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      }
    ]
  },

  "901": {
    "label": "tropical storm",
    "icon": "hurricane",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createRain",
        "num": 40
      }
    ]
  },

  "902": {
    "label": "hurricane",
    "icon": "hurricane",
    "function": [
      {
        "name": "createClouds",
        "num": 15
      },
      {
        "name": "createRain",
        "num": 40
      }
    ]
  },

  "903": {
    "label": "cold",
    "icon": "snowflake-cold",
    "function": [
      {
        "name": "createSnow",
        "num": 150
      }
    ]
  },

  "904": {
    "label": "hot",
    "icon": "hot",
    "function": [
      {
        "name": "createShining"
      },
      {
        "name": "createPulse",
        "num": 6
      }
    ]
  },

  "905": {
    "label": "windy",
    "icon": "windy",
    "function": [
      {
        "name": "createWind",
        "num": 15
      }
    ]
  },

  "906": {
    "label": "hail",
    "icon": "hail",
    "function": [
      {
        "name": "createRain",
        "num": 45
      }
    ]
  },

  "951": {
    "label": "calm",
    "icon": "sunny",
    "function": [
      {
        "name": "createShining"
      },
      {
        "name": "createPulse",
        "num": 6
      }
    ]
  },

  "952": {
    "label": "light breeze",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "953": {
    "label": "gentle breeze",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "954": {
    "label": "moderate breeze",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "955": {
    "label": "fresh breeze",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "956": {
    "label": "strong breeze",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "957": {
    "label": "high wind, near gale",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "958": {
    "label": "gale",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "959": {
    "label": "severe gale",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  },

  "960": {
    "label": "storm",
    "icon": "thunderstorm",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      },
      {
        "name": "createThunder",
        "num": 4
      }
    ]
  },

  "961": {
    "label": "violent storm",
    "icon": "thunderstorm",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      },
      {
        "name": "createThunder",
        "num": 4
      }
    ]
  },

  "962": {
    "label": "hurricane",
    "icon": "cloudy-gusts",
    "function": [
      {
        "name": "createWind",
        "num": 10
      },
      {
        "name": "createClouds",
        "num": 6
      }
    ]
  }
};








