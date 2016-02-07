
/*!
 Name: Ishtar Weather App || Timecast
 Dependencies: jQuery, OpenWeatherMap API
 Author: Carlos March
 Author URL: http://carlosmarch.es
 Date: Created: 5 feb, 2016
 Version : 2.0
 Licensed under the MIT license
 */


var apikey= '6da2b9398e94b1d868dce91051d30840';

var development = true;


$( document ).ready(function() {
    development == false? initApp(): initDevelopment();
});


/*
 * INIT FAKE DATA APP
 * No need to call to API
 * Creates random data for testing purposes
 *
 * */
function initDevelopment(lat,long){
    //if lat long call to api
    if (lat && long){
        var position = ' { "coords": { "longitude": '+lat+', "latitude": '+long+' } }';
        var json = JSON.parse(position);
        success(json);
        return
    }
    //create fake data
    var date            = new Date(2016, 0, 1, 7, 30);//y m d h min
    var hour            = randRange(1, 24);
    var celsius         = randRange(0, 40);
    var cityCountry     = 'NYC, USA';
    var cases = [];
    $.each(iconsData, function (key) {
        cases.push(key)
    });

    var randomiconKey       = randRange(0, cases.length-1);
    var iconID              = cases[randomiconKey];
    var iconTextLarge       = iconsData[cases[randomiconKey]].label;
    var dayNight            = ['day','night'];
    var randDayNight        = randRange(0, dayNight.length-1);


    //INIT DOM RENDERING
    //Init DOM rendering by fading the website
    fadeBody();

    //DOM data related to text
    //printTemperature(farenheit);
    printCity(cityCountry);
    printTime(date);
    printTextWeather(iconTextLarge);

    //DOM data related to environment
    makeDayOrNight(returnDayNightIcon(dayNight[randDayNight]));
    drawBackground(celsius, hour);
    iconIDtoEnvironment(iconID);
    $('body').append('<div class="domlog"></div>');
    $('.domlog').append(
        'HOUR = '+hour+ ' | ' +
        'TEMPERATURE = '+celsius+  ' | ' +
        'CITY = '+cityCountry+ ' | ' +
        'ICON = '+iconID
    );

}


/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
 /*
 * INIT PRODUCTION APP
 * Calls API and renders real data
 *
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/

function initApp() {
    clearData();
    getLocation();
}



/* This function inits the APP - By demanding location via HTML5 API
 * on success
 * function openWeatherCall
 * */
function getLocation(){
    if (navigator.geolocation) {
        //call openweather with location data
        navigator.geolocation.getCurrentPosition(success,error);
    } else {
        error('Geolocation not supported')
    }
};



/*
 * This function calls to openweather API
 * function openWeather api call
 *
 * */

function openWeatherCall(lat, long){

    var openWeatherAPI_Url = 'http://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+long+'&units=metric&appid='+apikey+'';

    return $.ajax({
        url: openWeatherAPI_Url,
        dataType: 'json'
    });
}



/*
 * ERROR function from navigator geolocation
 * Shows message
 *
 * */
function error(msg) {
    //console.log(msg);
    $('.text-bottom').prepend('<span>'+msg == 'string' ? msg : ""+'</span>').addClass('animated fadeInUp');
}



/*
 * SUCCESS function from navigator geolocation
 * Init the app by rendering functions after api call
 *
 * */
function success(position) {
    $.when(

        openWeatherCall(position.coords.latitude, position.coords.longitude)

    ).done(function(result){

        //result from openweather api

        var result          = result[0];

        var city            = result.name;
        var country         = result.sys.country;
        var sunrise         = result.sys.sunrise;
        var sunset          = result.sys.sunset;
        var iconID          = result.weather[0].id;
        var iconCode        = result.weather[0].icon;
        var iconText        = result.weather[0].main;
        var iconTextLarge   = result.weather[0].description;
        var celsius         = result.main.temp;

        //custom variables for managing interesting data
        var cityCountry     = city+', '+country;
        var date            = new Date();


        console.log(result);

        //INIT DOM RENDERING
        //Init DOM rendering by fading the website
        fadeBody();

        //DOM data related to text
        //printTemperature(farenheit);
        printCity(cityCountry);
        printTime(date);
        printTextWeather(iconTextLarge);

        //DOM data related to environment
        makeDayOrNight(returnDayNightIcon(iconCode));
        drawBackground(celsius, returnHour());
        iconIDtoEnvironment(iconID);

    });

}



/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/*
 * OPENWEATHER RELATED FUNCTIONS
 * Traduce data to day and night
 * Traduce data to environment
 * */
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/



/*
 * This function executes environment functions
 * Via icons.js reads associated functions and executes them
 * @param integer - iconId
 * */
function iconIDtoEnvironment(iconID){

    //@todo catch if error
    var functions = iconsData[iconID].function;

    for (var i = 0, len = functions.length; i < len; i++) {
        //console.log(iconID, iconsData[iconID].icon, functions[i])
        //Execute function when via its name as a string
        //functions[i].name || functions[i].num
        window[functions[i].name](functions[i].num?functions[i].num:'');
    }
}



/*
 * TThis function returns if it is day or night
 * by passing icon file code - ex: 10d
 * */
function returnDayNightIcon(defaultIconFileName){

    var timeOfDay;

    //if default icon name contains the letter 'd'
    if(defaultIconFileName.indexOf('d') != -1) {

        //define time of day as day
        timeOfDay = 'day';

    } else {

        //define time of day as night
        timeOfDay = 'night';
    }
    return timeOfDay;
}



/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/*
 * Init DOM Functions
 * Day or Night MAIN ICONS
 * */
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/


function makeDayOrNight(dayOrNight){
    // Execute createSun or createMoon
    if(dayOrNight === 'day'){
        createSun()
    }else if(dayOrNight === 'night'){
        createMoon();
    }else{
        console.log('err day/night')
    }
}


function createSun(){
    // Remove loader
    // Create Sun DOM Elem
    $('.icon-container').html('');
    $('.icon-container').append('<div class="sun"></div>');
}


function createMoon(){
    // Remove loader
    // Create Moon DOM Elem
    $('.icon-container').html('');
    $('.icon-container').append('<div class="moon"></div>');
}



/*
 * Init DOM Functions
 * DRAW BACKGROUND GRADIENT
 * @param integer Celsius
 * @param integer Current Time
 * */
function drawBackground(celsius, currentTime){
    var grad1 = returnColorByCelsius(celsius)
    var grad2 = returnColorByCurrentTime(currentTime)

    $('.environment__bottom').css({
        background: "-webkit-linear-gradient(-65deg, "+grad2+", "+grad1+")"
    }).css({
        background: "-o-linear-gradient(-65deg,"+grad2+", "+grad1+")"
    }).css({
        background: "-moz-linear-gradient(-65deg,"+grad2+", "+grad1+")"
    }).css({
        background: "linear-gradient(-65deg,"+grad2+", "+grad1+")"
    });
}



/*
 * COLOR FUNCTIONS
 * @functions reusable
 * */
function returnColorByCelsius(celsius) {
    //Color by temperature
    var grad1;
    if (0 <= celsius && celsius < 6) {
        //Too cold
        grad1 = '#393E46';
    }
    if (6 <= celsius && celsius < 10) {
        //Cold
        grad1 = '#48466D';
    }
    if (10 <= celsius && celsius < 15) {
        //warm
        grad1 = '#F8A79B';
    }
    if (15 <= celsius && celsius < 20) {
        createPulse(1);
        //hot
        grad1 = '#FFD460';
    }
    if (20 <= celsius && celsius < 30) {
        createPulse(2, '2x');
        createShining();
        //very hot
        grad1 = '#EB586F';
    }
    if (celsius > 30) {
        createPulse(3, '2x');
        createShining();
        //damn hot
        grad1 = '#EA5455';
    }

    return grad1;

}



function returnColorByCurrentTime(currentTime){
    //Color by time
    var grad2;
    if (0 <= currentTime&&currentTime < 6) {
        grad2 = '#000000';
    }
    if (6 <= currentTime&&currentTime < 9) {
        grad2 = '#563761';
    }
    if (9 <= currentTime&&currentTime < 12) {
        grad2 = '#F5FFAE';
    }
    if (12 <= currentTime&&currentTime < 16) {
        grad2 = '#FFB400';
    }
    if (16 <= currentTime&&currentTime < 19) {
        grad2 = '#56132A';
        createStars(50, grad2);
    }
    if (19 <= currentTime&&currentTime <= 24) {
        grad2 = '#1F1F1F';
        createStars(80, grad2);
    }
    return grad2;
}



/*
 * ENVIRONMENT FUNCTIONS
 * @functions reusable
 * */


function its_clear(){

}


function createRain(numDrop) {
    // function to generate RAIN DROPS
    // @param integer - Total Number of Drops
    // @usage createRain(120)

    // Create Sky for RAIN
    var rain = '<div class="rain"></div>';
    $('.environment__top').append(rain);

    for( i=1;i<numDrop;i++) {
        var x = $( document ).width()-10;
        var y = $( document ).height()-10;

        var dropLeft = randRange(0,x);
        var dropTop = randRange(-3000,0);

        var drop = '<div class="drop" id="drop'+i+'"></div>';
        $('.rain').append(drop);
        $('#drop'+i).css('left',dropLeft);
        $('#drop'+i).css('top',dropTop);
    }

}

function createClouds(numClouds){
    // function to generate CLOUDS
    // @param integer - Total Number of Clouds
    // @usage createClouds(2)

    //create darken
    var darken = '<div class="environment environment__middle" style="background: rgba(51, 51, 51, 0.30); "></div>';
    $('.environment__bottom').prepend(darken);

    // Create Sky for CLOUDS
    var clouds = '<div class="clouds"></div>';
    $('.environment__top').append(clouds);
    var iconPosition = $('.icon-container').offset();
    for( i=1;i<numClouds;i++) {
        var cloud ='<div id="cloud'+i+'" class="cloud"></div>';
        $('.clouds').append(cloud);
        $('#cloud'+i).css({
            'top'       : randRange(iconPosition.top,iconPosition.top+$('.icon-container').height()),
            'height'    : randRange(1,30),
            'background': 'rgba(255, 255, 255, 0.0'+randRange(1,7)+')'
        });
    }
}

function createFog(numFog){
    // function to generate FOG
    // @param integer - Total Number of FOG ELEMS
    // @usage createFog(2)

    //@TODO CHANGE FOR VIEWPORT HEIGHT BECOUSE OF NEGATIVE MARGINS
    var y = $( document ).height();

    // Create Sky for FOGS
    var fogs = '<div class="fogs"></div>';
    $('.environment__top').append(fogs);

    for( i=1;i<numFog;i++) {
        var fogTop  = randRange(y/2,y-400);
        var fog ='<div id="fog'+i+'" class="fog"></div>';
        $('.fogs').append(fog);
        $('#fog'+i).css({
            'top'       : fogTop,
            'height'    : randRange(100,450),
            'background': 'rgba(255, 255, 255, 0.0'+randRange(1,7)+')'
        });
    }
}



function createSnow(numSnow){
    // function to generate SNOW
    // @param integer - Total Number of Snowflakes
    // @usage createSnow(20)

    // Create Sky for STARS
    var snow = '<div class="snow"></div>';
    $('.environment__top').append(snow);

    for (var i = 0; i < numSnow; i++) {
        var size = randRange(0,4);
        var x = $( document ).width()-10;
        var y = $( document ).height()-10;


        var snowflake = '<div class="snowflake" id="snowflake'+i+'"></div>';
        $('.snow').append(snowflake);
        $('#snowflake'+i).css('left',randRange(0,x));
        $('#snowflake'+i).css('top',randRange(-100,y/2));
        $('#snowflake'+i).css("width", size);
        $('#snowflake'+i).css("height", size);

    }
}

function createThunder(numThunder){
    // function to generate Thunders
    // @param integer - Total Number of Thunders
    // @usage createThunder(20)

    // Create Sky for thunder
    var storm = '<div class="storm"></div>';
    $('.environment__top').append(storm);

    for (var i = 0; i < numThunder; i++) {
        var thunder = '<div class="thunder"></div>';
        $('.storm').append(thunder);
    }
}

function createPulse(numPulse, type){
    // function to generate Pulse for the sun
    // @param integer - Total Number of pulse
    // @param string - intensity '2x'
    // @usage createPulse(2, '2x');
    var type = type? type :'';

    for( i=0;i<numPulse;i++) {
        $('.sun').append('<div class="sun-pulse'+type+'"></div>');
    }
}



function createWind(numWind){
    console.log('@todo wind');
}



function createShining(){
    $('.sun').addClass('shining');
}


function createStars(howMany, timeColor){
    // function to generate STARS
    // @param integer - Total Number of Stars
    // @param string - Hex color from actual time
    // @usage createStars(80, '#e2e2e2')

    // Create Sky for STARS
    var stars = '<div class="stars"></div>';
    $('.environment__top').append(stars);

    for (var i = 0; i < howMany; i++) {

        var x               = $( document ).width()-10;
        var y               = $( document ).height()/3;
        var randomX         = randRange( 0, x);
        var randomY         = randRange( 0, y);
        var randomSize      = randRange( 1, 4);
        var randomOpacity   = randRange( 1, 100);
        var star            = '<div id="star'+i+'" class="star"></div>';

        $('.stars').append(star);

        var currentStar = $('body').find("#star"+i+"");
        currentStar.css('top', randomY);
        currentStar.css('left', randomX);
        currentStar.css("width", randomSize);
        currentStar.css("height", randomSize);

        if(i%2 == 0){
            //color by time
            currentStar.css("background", "rgba("+hex2rgb(""+timeColor+"")+",0."+randRange( 1, 50)+")");
        }else{
            //color white
            currentStar.css("background", "rgba(255, 255, 255,0."+randomOpacity+")");
        }

    }
}



/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/*
 * Init DOM Functions for
 * TEXT RENDERING
 * */
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
function printTextWeather(icon){
    // Print weather text status WEATHER
    // @param string - Icon from Forecast API
    // @usage printTextWeather('partly-cloud-day')
    var daystatus = icon.replace(/-/g, " ");
    $('.text-top').text(daystatus).addClass('animated fadeInDown');
}


function printCity(city){
    // Print CITY
    // @param string - City
    // @usage printCity('Valencia, Spain')
    $('.text-bottom').prepend('<span>'+city+'</span>').addClass('animated fadeInUp');
}


function printTime(date){
    // Print DAY and MONTH
    // @param date - y m d h min
    // @usage printTime(new Date());
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    var dayName = days[ date.getDay() ];
    var dayNum = date.getUTCDate();
    var monthName = months[ date.getMonth() ];

    //var h = date.getHours();
    //var m = date.getMinutes();
    //var currentTime = (h < 10 ? +'0'+String(h) : String(h)) +':'+ (m < 10 ? +'0'+String(m) : String(m));

    $('.text-bottom').append('<span>'+dayName +','+ dayNum +' '+ monthName+'</span>');
}


function printTemperature(farenheit){
    $('.temperature').html(farenheitToCelsius(farenheit)+'<span>°</span>').addClass('animated fadeInUp');
}



/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/*
 * UTILS
 * @functions reusable
 * */
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
function randRange( minNum, maxNum) {
    // function to generate a random number from determinate range.
    // @oaram integer minNum
    // @oaram integer maxNum
    // @usage randRange(0,100);
    return (Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
}

function hex2rgb(hex, opacity) {
    // function that returns rgba
    // @param hex color string
    // @param opacity from 0 to 1
    // @usage hex2rgb('#fff', '0.5')

    var h=hex.replace('#', '');
    h =  h.match(new RegExp('(.{'+h.length/3+'})', 'g'));

    for(var i=0; i<h.length; i++)
        h[i] = parseInt(h[i].length==1? h[i]+h[i]:h[i], 16);

    if (typeof opacity != 'undefined')  h.push(opacity);

    return h.join(',');
}

function farenheitToCelsius(f){
    // function that transforms farenheit to celsius
    // and returns CELSIUS
    // @oaram integer - Farenheit
    // @usage farenheitToCelsius(40);
    f = (f -32) * 5 / 9;
    c =  Math.round(f);

    if (c){
        return c;
    }
}

function returnHour(){
    // function that retuns current time HOUR
    var date = new Date()
    var curHr = date.getHours();
    return curHr;
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

function clearData(){
    // function that clears DOM data
    $('.environment__top').html('');
    $('.environment__bottom').html('');
    $('.text-top').html('');
    $('.text-bottom').html('');
    $('.icon-container').html('');
}

function fadeBody(){
    $('.environment__bottom').css({opacity: 0});
    $('.environment__bottom').animate({opacity: 1}, 2000);
}





