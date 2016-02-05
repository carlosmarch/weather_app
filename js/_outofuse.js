/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/*
 * Init DOM Functions
 * ENVIRONMENT
 * */
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/

/* This object manages environment conditions.
 * Maps iconText with a function that creates environment
 * @usage environment['iconName']()
 * @usage environment['clouds']()
 */
var environment = {
    'clear'                 : its_clear,
    'clouds'                : its_cloudy,
    'few-clouds'            : its_cloudy,
    'broken-clouds'         : its_cloudy,
    'shower-rain'           : its_rain,
    'rain'                  : its_rain,
    'storm'                 : its_rain,
    'snow'                  : its_snow,
    'mist'                  : its_fog
}

function makeEnvironment(iconName,iconID) {

    environment[iconName](iconID);

}

/*
 * Init ENVIRONMENT DOM rendering
 * OPENWEATHER ENVIRONMENT SPECIFIC FUNCTIONS
 * */
function its_clear(){

}

function its_cloudy(){

    //@todo manage clouds intensity by iconID

    createClouds(15);
}

function its_rain(iconID){

    //@todo manage rain intensity by iconID

    createRain(88);
    createClouds(10);
    createThunder(3);
}

function its_snow(){
    createSnow(80);
}

function its_fog(){
    createFog(5);
    createClouds(5);
}




// CURRENTLY NOT IN USE
// This function returns two parameters by passing icon file code
// @param string - results[0] 'day' or 'night' - if is day or night - this is for creating sun or moon
// @param string - results[1] the icon name - this is for creating environment

function returnDayNightIcon(defaultIconFileName){

    var iconName;

    var timeOfDay;

    //if default icon name contains the letter 'd'
    if(defaultIconFileName.indexOf('d') != -1) {

        //define time of day as day
        timeOfDay = 'day';

    } else {

        //define time of day as night
        timeOfDay = 'night';
    }

    //define icons
    //if icon is clear sky
    if(defaultIconFileName == '01d' || defaultIconFileName == '01n') {

        iconName = 'clear';

    }

    //if icon is clouds
    if(defaultIconFileName == '02d' || defaultIconFileName == '02n') {

        iconName = 'clouds';

    }

    //if icon is scattered clouds
    if(defaultIconFileName == '03d' || defaultIconFileName == '03n'){

        iconName = 'few-clouds';

    }

    //if icon is broken clouds
    if(defaultIconFileName == '04d' || defaultIconFileName == '04n') {

        iconName = 'broken-clouds';

    }

    //if icon is shower rain
    if(defaultIconFileName == '09d' || defaultIconFileName == '09n') {

        iconName = 'shower-rain';

    }


    //if icon is rain
    if(defaultIconFileName == '10d' || defaultIconFileName == '10n') {

        iconName = 'rain';

    }

    //if icon is thunderstorm
    if(defaultIconFileName == '11d' || defaultIconFileName == '11n') {

        iconName = 'storm';

    }

    //if icon is snow
    if(defaultIconFileName == '13d' || defaultIconFileName == '13n') {

        iconName = 'snow';

    }

    //if icon is mist
    if(defaultIconFileName == '50d' || defaultIconFileName == '50n') {

        iconName = 'mist';

    }

    return [timeOfDay, iconName]
}
