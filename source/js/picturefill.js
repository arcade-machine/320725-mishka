(function(window) {

var ua = navigator.userAgent;

if ( window.HTMLPictureElement && ((/ecko/).test(ua) && ua.match(/rv\:(\d+)/) && RegExp.$1 < 45) ) {
addEventListener("resize", (function() {
var timer;

var dummySrc = document.createElement("source");

var fixRespimg = function(img) {
var source, sizes;
var picture = img.parentNode;

if (picture.nodeName.toUpperCase() === "PICTURE") {
source = dummySrc.cloneNode();

picture.insertBefore(source, picture.firstElementChild);
setTimeout(function() {
picture.removeChild(source);
});
} else if (!img._pfLastSize || img.offsetWidth > img._pfLastSize) {
img._pfLastSize = img.offsetWidth;
sizes = img.sizes;
img.sizes += ",100vw";
setTimeout(function() {
img.sizes = sizes;
});
}
};

var findPictureImgs = function() {
var i;
var imgs = document.querySelectorAll("picture > img, img[srcset][sizes]");
for (i = 0; i < imgs.length; i++) {
fixRespimg(imgs[i]);
}
};
var onResize = function() {
clearTimeout(timer);
timer = setTimeout(findPictureImgs, 99);
};
var mq = window.matchMedia && matchMedia("(orientation: landscape)");
var init = function() {
onResize();

if (mq && mq.addListener) {
mq.addListener(onResize);
}
};

dummySrc.srcset = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

if (/^[c|i]|d$/.test(document.readyState || "")) {
init();
} else {
document.addEventListener("DOMContentLoaded", init);
}

return onResize;
})());
}
})(window);

(function( window, document, undefined ) {

"use strict";

document.createElement( "picture" );

var warn, eminpx, alwaysCheckWDescriptor, evalId;

var pf = {};
var isSupportTestReady = false;
var noop = function() {};
var image = document.createElement( "img" );
var getImgAttr = image.getAttribute;
var setImgAttr = image.setAttribute;
var removeImgAttr = image.removeAttribute;
var docElem = document.documentElement;
var types = {};
var cfg = {
//resource selection:
algorithm: ""
};
var srcAttr = "data-pfsrc";
var srcsetAttr = srcAttr + "set";

var ua = navigator.userAgent;
var supportAbort = (/rident/).test(ua) || ((/ecko/).test(ua) && ua.match(/rv\:(\d+)/) && RegExp.$1 > 35 );
var curSrcProp = "currentSrc";
var regWDesc = /\s+\+?\d+(e\d+)?w/;
var regSize = /(\([^)]+\))?\s*(.+)/;
var setOptions = window.picturefillCFG;

var baseStyle = "position:absolute;left:0;visibility:hidden;display:block;padding:0;border:none;font-size:1em;width:1em;overflow:hidden;clip:rect(0px, 0px, 0px, 0px)";
var fsCss = "font-size:100%!important;";
var isVwDirty = true;

var cssCache = {};
var sizeLengthCache = {};
var DPR = window.devicePixelRatio;
var units = {
px: 1,
in": 96
};
var anchor = document.createElement( "a" );

var alreadyRun = false;

var regexLeadingSpaces = /^[ \t\n\r\u000c]+/,
regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/,
regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/,
regexTrailingCommas = /[,]+$/,
regexNonNegativeInteger = /^\d+$/,

regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

var on = function(obj, evt, fn, capture) {
if ( obj.addEventListener ) {
obj.addEventListener(evt, fn, capture || false);
} else if ( obj.attachEvent ) {
obj.attachEvent( "on" + evt, fn);
}
};

var memoize = function(fn) {
var cache = {};
return function(input) {
if ( !(input in cache) ) {
cache[ input ] = fn(input);
}
return cache[ input ];
};
};

function isSpace(c) {
return (c === "\u0020" || // space
c === "\u0009" || // horizontal tab
c === "\u000A" || // new line
c === "\u000C" || // form feed
c === "\u000D");  // carriage return
}

var evalCSS = (function() {

var regLength = /^([\d\.]+)(em|vw|px)$/;
var replace = function() {
var args = arguments, index = 0, string = args[0];
while (++index in args) {
string = string.replace(args[index], args[++index]);
}
return string;
};

var buildStr = memoize(function(css) {

return "return " + replace((css || "").toLowerCase(),

/\band\b/g, "&&",


/,/g, "||",

/min-([a-z-\s]+):/g, "e.$1>=",

/max-([a-z-\s]+):/g, "e.$1<=",

/calc([^)]+)/g, "($1)",

/(\d+[\.]*[\d]*)([a-z]+)/g, "($1 * e.$2)",
/^(?!(e.[a-z]|[0-9\.&=|><\+\-\*\(\)\/])).*/ig, ""
) + ";";
});

return function(css, length) {
var parsedLength;
if (!(css in cssCache)) {
cssCache[css] = false;
if (length && (parsedLength = css.match( regLength ))) {
cssCache[css] = parsedLength[ 1 ] * units[parsedLength[ 2 ]];
} else {

try{
cssCache[css] = new Function("e", buildStr(css))(units);
} catch(e) {}
}
}
return cssCache[css];
};
})();

var setResolution = function( candidate, sizesattr ) {
if ( candidate.w ) { // h = means height: || descriptor.type === 'h' do not handle yet...
candidate.cWidth = pf.calcListLength( sizesattr || "100vw" );
candidate.res = candidate.w / candidate.cWidth ;
} else {
candidate.res = candidate.d;
}
return candidate;
};

var picturefill = function( opt ) {

if (!isSupportTestReady) {return;}

var elements, i, plen;

var options = opt || {};

if ( options.elements && options.elements.nodeType === 1 ) {
if ( options.elements.nodeName.toUpperCase() === "IMG" ) {
options.elements =  [ options.elements ];
} else {
options.context = options.elements;
options.elements =  null;
}
}

elements = options.elements || pf.qsa( (options.context || document), ( options.reevaluate || options.reselect ) ? pf.sel : pf.selShort );

if ( (plen = elements.length) ) {

pf.setupRun( options );
alreadyRun = true;

for ( i = 0; i < plen; i++ ) {
pf.fillImg(elements[ i ], options);
}

pf.teardownRun( options );
}
};

warn = ( window.console && console.warn ) ?
function( message ) {
console.warn( message );
} :
noop
;

if ( !(curSrcProp in image) ) {
curSrcProp = "src";
}

types[ "image/jpeg" ] = true;
types[ "image/gif" ] = true;
types[ "image/png" ] = true;

function detectTypeSupport( type, typeUri ) {

var image = new window.Image();
image.onerror = function() {
types[ type ] = false;
picturefill();
};
image.onload = function() {
types[ type ] = image.width === 1;
picturefill();
};
image.src = typeUri;
return "pending";
}

types[ "image/svg+xml" ] = document.implementation.hasFeature( "http://www.w3.org/TR/SVG11/feature#Image", "1.1" );

function updateMetrics() {

isVwDirty = false;
DPR = window.devicePixelRatio;
cssCache = {};
sizeLengthCache = {};

pf.DPR = DPR || 1;

units.width = Math.max(window.innerWidth || 0, docElem.clientWidth);
units.height = Math.max(window.innerHeight || 0, docElem.clientHeight);

units.vw = units.width / 100;
units.vh = units.height / 100;

evalId = [ units.height, units.width, DPR ].join("-");

units.em = pf.getEmValue();
units.rem = units.em;
}

function chooseLowRes( lowerValue, higherValue, dprValue, isCached ) {
var bonusFactor, tooMuch, bonus, meanDensity;


if (cfg.algorithm === "saveData" ){
if ( lowerValue > 2.7 ) {
meanDensity = dprValue + 1;
} else {
tooMuch = higherValue - dprValue;
bonusFactor = Math.pow(lowerValue - 0.6, 1.5);

bonus = tooMuch * bonusFactor;

if (isCached) {
bonus += 0.1 * bonusFactor;
}

meanDensity = lowerValue + bonus;
}
} else {
meanDensity = (dprValue > 1) ?
Math.sqrt(lowerValue * higherValue) :
lowerValue;
}

return meanDensity > dprValue;
}

function applyBestCandidate( img ) {
var srcSetCandidates;
var matchingSet = pf.getSet( img );
var evaluated = false;
if ( matchingSet !== "pending" ) {
evaluated = evalId;
if ( matchingSet ) {
srcSetCandidates = pf.setRes( matchingSet );
pf.applySetCandidate( srcSetCandidates, img );
}
}
img[ pf.ns ].evaled = evaluated;
}

function ascendingSort( a, b ) {
return a.res - b.res;
}

function setSrcToCur( img, src, set ) {
var candidate;
if ( !set && src ) {
set = img[ pf.ns ].sets;
set = set && set[set.length - 1];
}

candidate = getCandidateForSrc(src, set);

if ( candidate ) {
src = pf.makeUrl(src);
img[ pf.ns ].curSrc = src;
img[ pf.ns ].curCan = candidate;

if ( !candidate.res ) {
setResolution( candidate, candidate.set.sizes );
}
}
return candidate;
}

function getCandidateForSrc( src, set ) {
var i, candidate, candidates;
if ( src && set ) {
candidates = pf.parseSet( set );
src = pf.makeUrl(src);
for ( i = 0; i < candidates.length; i++ ) {
if ( src === pf.makeUrl(candidates[ i ].url) ) {
candidate = candidates[ i ];
break;
}
}
}
return candidate;
}

function getAllSourceElements( picture, candidates ) {
var i, len, source, srcset;


var sources = picture.getElementsByTagName( "source" );

for ( i = 0, len = sources.length; i < len; i++ ) {
source = sources[ i ];
source[ pf.ns ] = true;
srcset = source.getAttribute( "srcset" );

// if source does not have a srcset attribute, skip
if ( srcset ) {
candidates.push( {
srcset: srcset,
media: source.getAttribute( "media" ),
type: source.getAttribute( "type" ),
sizes: source.getAttribute( "sizes" )
} );
}
}
}

function parseSrcset(input, set) {

function collectCharacters(regEx) {
var chars,
match = regEx.exec(input.substring(pos));
if (match) {
chars = match[ 0 ];
pos += chars.length;
return chars;
}
}

var inputLength = input.length,
url,
descriptors,
currentDescriptor,
state,
c,


pos = 0,

candidates = [];

function parseDescriptors() {

var pError = false,

w, d, h, i,
candidate = {},
desc, lastChar, value, intVal, floatVal;

for (i = 0 ; i < descriptors.length; i++) {
desc = descriptors[ i ];

lastChar = desc[ desc.length - 1 ];
value = desc.substring(0, desc.length - 1);
intVal = parseInt(value, 10);
floatVal = parseFloat(value);

if (regexNonNegativeInteger.test(value) && (lastChar === "w")) {

if (w || d) {pError = true;}

if (intVal === 0) {pError = true;} else {w = intVal;}

} else if (regexFloatingPoint.test(value) && (lastChar === "x")) {

if (w || d || h) {pError = true;}

if (floatVal < 0) {pError = true;} else {d = floatVal;}

} else if (regexNonNegativeInteger.test(value) && (lastChar === "h")) {

// If height and density are not both absent, then let error be yes.
if (h || d) {pError = true;}

// Apply the rules for parsing non-negative integers to the descriptor.
// If the result is zero, let error be yes. Otherwise, let future-compat-h
// be the result.
if (intVal === 0) {pError = true;} else {h = intVal;}

// Anything else, Let error be yes.
} else {pError = true;}
} // (close step 13 for loop)

if (!pError) {
candidate.url = url;

if (w) { candidate.w = w;}
if (d) { candidate.d = d;}
if (h) { candidate.h = h;}
if (!h && !d && !w) {candidate.d = 1;}
if (candidate.d === 1) {set.has1x = true;}
candidate.set = set;

candidates.push(candidate);
}
} // (close parseDescriptors fn)

function tokenize() {

collectCharacters(regexLeadingSpaces);

currentDescriptor = "";

state = "in descriptor";

while (true) {

c = input.charAt(pos);


if (state === "in descriptor") {

if (isSpace(c)) {
if (currentDescriptor) {
descriptors.push(currentDescriptor);
currentDescriptor = "";
state = "after descriptor";
}

} else if (c === ",") {
pos += 1;
if (currentDescriptor) {
descriptors.push(currentDescriptor);
}
parseDescriptors();
return;

} else if (c === "\u0028") {
currentDescriptor = currentDescriptor + c;
state = "in parens";

} else if (c === "") {
if (currentDescriptor) {
descriptors.push(currentDescriptor);
}
parseDescriptors();
return;

} else {
currentDescriptor = currentDescriptor + c;
}

} else if (state === "in parens") {

if (c === ")") {
currentDescriptor = currentDescriptor + c;
state = "in descriptor";

} else if (c === "") {
descriptors.push(currentDescriptor);
parseDescriptors();
return;

} else {
currentDescriptor = currentDescriptor + c;
}

} else if (state === "after descriptor") {

if (isSpace(c)) {

} else if (c === "") {
parseDescriptors();
return;

} else {
state = "in descriptor";
pos -= 1;

}
}

// Advance position to the next character in input.
pos += 1;


} // (close while true loop)
}

while (true) {
collectCharacters(regexLeadingCommasOrSpaces);
dates and abort these steps.
if (pos >= inputLength) {
return candidates; // (we're done, this is the sole return path)
}

url = collectCharacters(regexLeadingNotSpaces);

descriptors = [];

if (url.slice(-1) === ",") {
url = url.replace(regexTrailingCommas, "");
// (Jump ahead to step 9 to skip tokenization and just push the candidate).
parseDescriptors();

} else {
tokenize();
}
} // (Close of big while loop.)
}

function parseSizes(strValue) {

var regexCssLengthWithUnits = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i;

var regexCssCalc = /^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i;

var i;
var unparsedSizesList;
var unparsedSizesListLength;
var unparsedSize;
var lastComponentValue;
var size;

function parseComponentValues(str) {
var chrctr;
var component = "";
var componentArray = [];
var listArray = [];
var parenDepth = 0;
var pos = 0;
var inComment = false;

function pushComponent() {
if (component) {
componentArray.push(component);
component = "";
}
}

function pushComponentArray() {
if (componentArray[0]) {
istArray.push(componentArray);
componentArray = [];
}
}

// (Loop forwards from the beginning of the string.)
while (true) {
chrctr = str.charAt(pos);

if (chrctr === "") { // ( End of string reached.)
pushComponent();
pushComponentArray();
return listArray;
} else if (inComment) {
if ((chrctr === "*") && (str[pos + 1] === "/")) { // (At end of a comment.)
inComment = false;
pos += 2;
pushComponent();
continue;
} else {
pos += 1; // (Skip all characters inside comments.)
continue;
}
} else if (isSpace(chrctr)) {
if ( (str.charAt(pos - 1) && isSpace( str.charAt(pos - 1) ) ) || !component ) {
pos += 1;
continue;
} else if (parenDepth === 0) {
pushComponent();
pos +=1;
continue;
} else {
// (Replace any space character with a plain space for legibility.)
chrctr = " ";
}
} else if (chrctr === "(") {
parenDepth += 1;
} else if (chrctr === ")") {
parenDepth -= 1;
} else if (chrctr === ",") {
pushComponent();
pushComponentArray();
pos += 1;
continue;
} else if ( (chrctr === "/") && (str.charAt(pos + 1) === "*") ) {
inComment = true;
pos += 2;
continue;
}

component = component + chrctr;
pos += 1;
}
}

function isValidNonNegativeSourceSizeValue(s) {
if (regexCssLengthWithUnits.test(s) && (parseFloat(s) >= 0)) {return true;}
if (regexCssCalc.test(s)) {return true;}
// ( http://www.w3.org/TR/CSS2/syndata.html#numbers says:
// "-0 is equivalent to 0 and is not a negative number." which means that
// unitless zero and unitless negative zero must be accepted as special cases.)
if ((s === "0") || (s === "-0") || (s === "+0")) {return true;}
return false;
}

unparsedSizesList = parseComponentValues(strValue);
unparsedSizesListLength = unparsedSizesList.length;

// For each unparsed size in unparsed sizes list:
for (i = 0; i < unparsedSizesListLength; i++) {
unparsedSize = unparsedSizesList[i];

lastComponentValue = unparsedSize[unparsedSize.length - 1];

if (isValidNonNegativeSourceSizeValue(lastComponentValue)) {
size = lastComponentValue;
unparsedSize.pop();
} else {
continue;
}

// 3. Remove all consecutive <whitespace-token>s from the end of unparsed
// size. If unparsed size is now empty, return size and exit this algorithm.
// If this was not the last item in unparsed sizes list, that is a parse error.
if (unparsedSize.length === 0) {
return size;
}

// 4. Parse the remaining component values in unparsed size as a
// <media-condition>. If it does not parse correctly, or it does parse
// correctly but the <media-condition> evaluates to false, continue to the
// next iteration of this algorithm.
// (Parsing all possible compound media conditions in JS is heavy, complicated,
// and the payoff is unclear. Is there ever an situation where the
// media condition parses incorrectly but still somehow evaluates to true?
// Can we just rely on the browser/polyfill to do it?)
unparsedSize = unparsedSize.join(" ");
if (!(pf.matchesMedia( unparsedSize ) ) ) {
continue;
}

// 5. Return size and exit this algorithm.
return size;
}

// If the above algorithm exhausts unparsed sizes list without returning a
// size value, return 100vw.
return "100vw";
}

// namespace
pf.ns = ("pf" + new Date().getTime()).substr(0, 9);

// srcset support test
pf.supSrcset = "srcset" in image;
pf.supSizes = "sizes" in image;
pf.supPicture = !!window.HTMLPictureElement;

// UC browser does claim to support srcset and picture, but not sizes,
// this extended test reveals the browser does support nothing
if (pf.supSrcset && pf.supPicture && !pf.supSizes) {
(function(image2) {
image.srcset = "data:,a";
image2.src = "data:,a";
pf.supSrcset = image.complete === image2.complete;
pf.supPicture = pf.supSrcset && pf.supPicture;
})(document.createElement("img"));
}

// Safari9 has basic support for sizes, but does't expose the `sizes` idl attribute
if (pf.supSrcset && !pf.supSizes) {

(function() {
var width2 = "data:image/gif;base64,R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==";
var width1 = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
var img = document.createElement("img");
var test = function() {
var width = img.width;

if (width === 2) {
pf.supSizes = true;
}

alwaysCheckWDescriptor = pf.supSrcset && !pf.supSizes;

isSupportTestReady = true;
// force async
setTimeout(picturefill);
};

img.onload = test;
img.onerror = test;
img.setAttribute("sizes", "9px");

img.srcset = width1 + " 1w," + width2 + " 9w";
img.src = width1;
})();

} else {
isSupportTestReady = true;
}

// using pf.qsa instead of dom traversing does scale much better,
/ especially on sites mixing responsive and non-responsive images
pf.selShort = "picture>img,img[srcset]";
pf.sel = pf.selShort;
pf.cfg = cfg;

/**
	 * Shortcut property for `devicePixelRatio` ( for easy overriding in tests )
	 */
pf.DPR = (DPR  || 1 );
pf.u = units;

// container of supported mime types that one might need to qualify before using
pf.types =  types;

pf.setSize = noop;

/**
	 * Gets a string and returns the absolute URL
	 * @param src
	 * @returns {String} absolute URL
	 */

pf.makeUrl = memoize(function(src) {
anchor.href = src;
return anchor.href;
});

/**
	 * Gets a DOM element or document and a selctor and returns the found matches
	 * Can be extended with jQuery/Sizzle for IE7 support
	 * @param context
	 * @param sel
	 * @returns {NodeList|Array}
	 */
pf.qsa = function(context, sel) {
return ( "querySelector" in context ) ? context.querySelectorAll(sel) : [];
};

/**
	 * Shortcut method for matchMedia ( for easy overriding in tests )
	 * wether native or pf.mMQ is used will be decided lazy on first call
	 * @returns {boolean}
	 */
pf.matchesMedia = function() {
if ( window.matchMedia && (matchMedia( "(min-width: 0.1em)" ) || {}).matches ) {
pf.matchesMedia = function( media ) {
return !media || ( matchMedia( media ).matches );
};
} else {
pf.matchesMedia = pf.mMQ;
}

return pf.matchesMedia.apply( this, arguments );
};

/**
	 * A simplified matchMedia implementation for IE8 and IE9
	 * handles only min-width/max-width with px or em values
	 * @param media
	 * @returns {boolean}
	 */
pf.mMQ = function( media ) {
return media ? evalCSS(media) : true;
};

/**
	 * Returns the calculated length in css pixel from the given sourceSizeValue
	 * http://dev.w3.org/csswg/css-values-3/#length-value
	 * intended Spec mismatches:
	 * * Does not check for invalid use of CSS functions
	 * * Does handle a computed length of 0 the same as a negative and therefore invalid value
	 * @param sourceSizeValue
	 * @returns {Number}
	 */
pf.calcLength = function( sourceSizeValue ) {

var value = evalCSS(sourceSizeValue, true) || false;
if (value < 0) {
value = false;
}

return value;
};

/**
	 * Takes a type string and checks if its supported
	 */

pf.supportsType = function( type ) {
return ( type ) ? types[ type ] : true;
};

/**
	 * Parses a sourceSize into mediaCondition (media) and sourceSizeValue (length)
	 * @param sourceSizeStr
	 * @returns {*}
	 */
pf.parseSize = memoize(function( sourceSizeStr ) {
var match = ( sourceSizeStr || "" ).match(regSize);
return {
media: match && match[1],
length: match && match[2]
};
});

pf.parseSet = function( set ) {
if ( !set.cands ) {
set.cands = parseSrcset(set.srcset, set);
}
return set.cands;
};

/**
	 * returns 1em in css px for html/body default size
	 * function taken from respondjs
	 * @returns {*|number}
	 */
pf.getEmValue = function() {
var body;
if ( !eminpx && (body = document.body) ) {
var div = document.createElement( "div" ),
originalHTMLCSS = docElem.style.cssText,
originalBodyCSS = body.style.cssText;

div.style.cssText = baseStyle;

// 1em in a media query is the value of the default font size of the browser
// reset docElem and body to ensure the correct value is returned
docElem.style.cssText = fsCss;
body.style.cssText = fsCss;

body.appendChild( div );
eminpx = div.offsetWidth;
body.removeChild( div );

//also update eminpx before returning
eminpx = parseFloat( eminpx, 10 );

// restore the original values
docElem.style.cssText = originalHTMLCSS;
body.style.cssText = originalBodyCSS;

}
return eminpx || 16;
};

/**
	 * Takes a string of sizes and returns the width in pixels as a number
	 */
pf.calcListLength = function( sourceSizeListStr ) {
// Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
//
//                           or (min-width:30em) calc(30% - 15px)
if ( !(sourceSizeListStr in sizeLengthCache) || cfg.uT ) {
var winningLength = pf.calcLength( parseSizes( sourceSizeListStr ) );

sizeLengthCache[ sourceSizeListStr ] = !winningLength ? units.width : winningLength;
}

return sizeLengthCache[ sourceSizeListStr ];
};

/**
	 * Takes a candidate object with a srcset property in the form of url/
	 * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
	 *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
	 *     "images/pic-small.png"
	 * Get an array of image candidates in the form of
	 *      {url: "/foo/bar.png", resolution: 1}
	 * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
	 * If sizes is specified, res is calculated
	 */
pf.setRes = function( set ) {
var candidates;
if ( set ) {

candidates = pf.parseSet( set );

for ( var i = 0, len = candidates.length; i < len; i++ ) {
setResolution( candidates[ i ], set.sizes );
}
}
return candidates;
};

pf.setRes.res = setResolution;

pf.applySetCandidate = function( candidates, img ) {
if ( !candidates.length ) {return;}
var candidate,
i,
j,
length,
bestCandidate,
curSrc,
curCan,
candidateSrc,
abortCurSrc;

var imageData = img[ pf.ns ];
var dpr = pf.DPR;

curSrc = imageData.curSrc || img[curSrcProp];

curCan = imageData.curCan || setSrcToCur(img, curSrc, candidates[0].set);

// if we have a current source, we might either become lazy or give this source some advantage
if ( curCan && curCan.set === candidates[ 0 ].set ) {

// if browser can abort image request and the image has a higher pixel density than needed
// and this image isn't downloaded yet, we skip next part and try to save bandwidth
abortCurSrc = (supportAbort && !img.complete && curCan.res - 0.1 > dpr);

if ( !abortCurSrc ) {
curCan.cached = true;

// if current candidate is "best", "better" or "okay",
// set it to bestCandidate
if ( curCan.res >= dpr ) {
bestCandidate = curCan;
}
}
}

if ( !bestCandidate ) {

candidates.sort( ascendingSort );

length = candidates.length;
bestCandidate = candidates[ length - 1 ];

for ( i = 0; i < length; i++ ) {
candidate = candidates[ i ];
if ( candidate.res >= dpr ) {
j = i - 1;

// we have found the perfect candidate,
// but let's improve this a little bit with some assumptions ;-)
if (candidates[ j ] &&
(abortCurSrc || curSrc !== pf.makeUrl( candidate.url )) &&
chooseLowRes(candidates[ j ].res, candidate.res, dpr, candidates[ j ].cached)) {

bestCandidate = candidates[ j ];

} else {
bestCandidate = candidate;
}
break;
}
}
}

if ( bestCandidate ) {

candidateSrc = pf.makeUrl( bestCandidate.url );

imageData.curSrc = candidateSrc;
imageData.curCan = bestCandidate;

if ( candidateSrc !== curSrc ) {
pf.setSrc( img, bestCandidate );
}
pf.setSize( img );
}
};

pf.setSrc = function( img, bestCandidate ) {
var origWidth;
img.src = bestCandidate.url;

// although this is a specific Safari issue, we don't want to take too much different code paths
if ( bestCandidate.set.type === "image/svg+xml" ) {
origWidth = img.style.width;
img.style.width = (img.offsetWidth + 1) + "px";

// next line only should trigger a repaint
// if... is only done to trick dead code removal
if ( img.offsetWidth + 1 ) {
img.style.width = origWidth;
}
}
};

pf.getSet = function( img ) {
var i, set, supportsType;
var match = false;
var sets = img [ pf.ns ].sets;

for ( i = 0; i < sets.length && !match; i++ ) {
set = sets[i];

if ( !set.srcset || !pf.matchesMedia( set.media ) || !(supportsType = pf.supportsType( set.type )) ) {
continue;
}

if ( supportsType === "pending" ) {
set = supportsType;
}

match = set;
break;
}

return match;
};

pf.parseSets = function( element, parent, options ) {
var srcsetAttribute, imageSet, isWDescripor, srcsetParsed;

var hasPicture = parent && parent.nodeName.toUpperCase() === "PICTURE";
var imageData = element[ pf.ns ];

if ( imageData.src === undefined || options.src ) {
imageData.src = getImgAttr.call( element, "src" );
if ( imageData.src ) {
setImgAttr.call( element, srcAttr, imageData.src );
} else {
removeImgAttr.call( element, srcAttr );
}
}

if ( imageData.srcset === undefined || options.srcset || !pf.supSrcset || element.srcset ) {
srcsetAttribute = getImgAttr.call( element, "srcset" );
imageData.srcset = srcsetAttribute;
srcsetParsed = true;
}

imageData.sets = [];

if ( hasPicture ) {
imageData.pic = true;
getAllSourceElements( parent, imageData.sets );
}

if ( imageData.srcset ) {
imageSet = {
srcset: imageData.srcset,
sizes: getImgAttr.call( element, "sizes" )
};

imageData.sets.push( imageSet );

isWDescripor = (alwaysCheckWDescriptor || imageData.src) && regWDesc.test(imageData.srcset || "");

// add normal src as candidate, if source has no w descriptor
if ( !isWDescripor && imageData.src && !getCandidateForSrc(imageData.src, imageSet) && !imageSet.has1x ) {
imageSet.srcset += ", " + imageData.src;
imageSet.cands.push({
url: imageData.src,
d: 1,
set: imageSet
});
}

} else if ( imageData.src ) {
imageData.sets.push( {
srcset: imageData.src,
sizes: null
} );
}

imageData.curCan = null;
imageData.curSrc = undefined;

// if img has picture or the srcset was removed or has a srcset and does not support srcset at all
// or has a w descriptor (and does not support sizes) set support to false to evaluate
imageData.supported = !( hasPicture || ( imageSet && !pf.supSrcset ) || (isWDescripor && !pf.supSizes) );

if ( srcsetParsed && pf.supSrcset && !imageData.supported ) {
if ( srcsetAttribute ) {
setImgAttr.call( element, srcsetAttr, srcsetAttribute );
element.srcset = "";
} else {
removeImgAttr.call( element, srcsetAttr );
}
}

if (imageData.supported && !imageData.srcset && ((!imageData.src && element.src) ||  element.src !== pf.makeUrl(imageData.src))) {
if (imageData.src === null) {
element.removeAttribute("src");
} else {
element.src = imageData.src;
}
}

imageData.parsed = true;
};

pf.fillImg = function(element, options) {
var imageData;
var extreme = options.reselect || options.reevaluate;

// expando for caching data on the img
if ( !element[ pf.ns ] ) {
element[ pf.ns ] = {};
}

imageData = element[ pf.ns ];

// if the element has already been evaluated, skip it
// unless `options.reevaluate` is set to true ( this, for example,
// is set to true when running `picturefill` on `resize` ).
if ( !extreme && imageData.evaled === evalId ) {
return;
}

if ( !imageData.parsed || options.reevaluate ) {
pf.parseSets( element, element.parentNode, options );
}

if ( !imageData.supported ) {
applyBestCandidate( element );
} else {
imageData.evaled = evalId;
}
};

pf.setupRun = function() {
if ( !alreadyRun || isVwDirty || (DPR !== window.devicePixelRatio) ) {
updateMetrics();
}
};

// If picture is supported, well, that's awesome.
if ( pf.supPicture ) {
picturefill = noop;
pf.fillImg = noop;
} else {

// Set up picture polyfill by polling the document
(function() {
var isDomReady;
var regReady = window.attachEvent ? /d$|^c/ : /d$|^c|^i/;

var run = function() {
var readyState = document.readyState || "";

timerId = setTimeout(run, readyState === "loading" ? 200 :  999);
if ( document.body ) {
pf.fillImgs();
isDomReady = isDomReady || regReady.test(readyState);
if ( isDomReady ) {
clearTimeout( timerId );
}

}
};

var timerId = setTimeout(run, document.body ? 9 : 99);

// Also attach picturefill on resize and readystatechange
// http://modernjavascript.blogspot.com/2013/08/building-better-debounce.html
var debounce = function(func, wait) {
var timeout, timestamp;
var later = function() {
var last = (new Date()) - timestamp;

if (last < wait) {
timeout = setTimeout(later, wait - last);
} else {
timeout = null;
func();
}
};

return function() {
timestamp = new Date();

if (!timeout) {
timeout = setTimeout(later, wait);
}
};
};
var lastClientWidth = docElem.clientHeight;
var onResize = function() {
isVwDirty = Math.max(window.innerWidth || 0, docElem.clientWidth) !== units.width || docElem.clientHeight !== lastClientWidth;
lastClientWidth = docElem.clientHeight;
if ( isVwDirty ) {
pf.fillImgs();
}
};

on( window, "resize", debounce(onResize, 99 ) );
on( document, "readystatechange", run );
})();
}

pf.picturefill = picturefill;
//use this internally for easy monkey patching/performance testing
pf.fillImgs = picturefill;
pf.teardownRun = noop;

/* expose methods for testing */
picturefill._ = pf;

window.picturefillCFG = {
pf: pf,
push: function(args) {
var name = args.shift();
if (typeof pf[name] === "function") {
pf[name].apply(pf, args);
} else {
cfg[name] = args[0];
if (alreadyRun) {
pf.fillImgs( { reselect: true } );
}
}
}
};

while (setOptions && setOptions.length) {
window.picturefillCFG.push(setOptions.shift());
}

/* expose picturefill */
window.picturefill = picturefill;

/* expose picturefill */
if ( typeof module === "object" && typeof module.exports === "object" ) {
// CommonJS, just export
module.exports = picturefill;
  } else if ( typeof define === "function" && define.amd ) {
// AMD support
define( "picturefill", function() { return picturefill; } );
  }

// IE8 evals this sync, so it must be the last thing we do
if ( !pf.supPicture ) {
types[ "image/webp" ] = detectTypeSupport("image/webp", "data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA==" );
}

} )( window, document );
