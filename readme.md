jsCalendar is a lightweight date picker for desktop and mobile browsers.

# Features

* small file size
* designed for webkit mobile, mainly iOS and Android
* support for desktop browsers
* works with jQuery as well as Zepto.js
* range of days selection mode
* single date selection mode
* 3D calendar turn over css3 animation, supported by Safari only
* multilingual support
* flexible first day of the week
* multiple calendars on one page possible
* past dates are prevented by default, but can be configured
* multiple selections possible (without selection range)

# Requirements

* [jQuery](http://jquery.com/) or [Zepto.js](https://github.com/madrobby/zepto)
* [Modernizr](http://www.modernizr.com/) or the included Modernizr custom build using a reduced subset. If Modernizr is not initialized, 3D animations will not be supported.

# Usage

On document ready, the calendar attaches itself to HTML elements with the class name "jsCalendar". Manual initialization is not necessary. This element should have an attribute `data-localized_date` with a JSON string as value containing the localized names of months and weekdays like this one:

    {"days":{"names":{"min":["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}},"months":{"names":{"long":["January","February","March","April","May","June","July","August","September","October","November","December"]}}}

### Default and single date selection mode only:
It is possible to select a range of days between start and end date as well as selecting a single date or even multiple dates. Range selection is default. To switch to single date selection, add the class name `jsSingleDate` to the jsCalendar HTML element before document ready.

On single and range date selection you are notified when the user changes the selection by the custom events `startDateChanged` and `endDateChanged` on the jsCalender HTML element. So the currently selected dates can be retrieved like this:

    $(".jsCalendar").bind("startDateChanged", function() {
        $(this).data("startdate");
    }).bind("endDateChanged", function() {
        $(this).data("enddate");
    });

If you are using the single date selection mode, `startDateChanged` is the only triggered event.

### Multiple date selection only:
For multiple date selection, add the class name `jsMultipleDates` similar to the single date selection.
Also, a maximum number of dates can be set with the attribute `data-multipledates-max`.

For the multiple date selection the custom events `multipleChanged`, `multipleAdded` and `multipleRemoved` on the jsCalender HTML element will inform you about changes on the date selection.
The `multipleChanged` event will be fired when a date is (un)selected and delivers an additional parameter `object` along to the event. This object stores two variables: `object.dates` is an array with all selected dates as Date() objects. Furthermore the variable `object.changedDate` stores the currently changed date as a Date() object. The data attribute also stores the same object as `object.dates` but in JSON format.

    $(".jsCalendar").bind("multipleDatesChanged multipleDatesAdded multipleDatesRemoved", function(evt, object) {
        $(this).data("multipledates"); // JSON string with all selected dates
        object.dates; // array with all selected dates
        object.changedDate; // string with new (un)selected date
    });

Additionally for the multiple date selection there are two events `multipleDatesAdded` and `multipleDatesRemoved`. These events have the same functionality as the `multipleDatesChanged` event but they are called specifically when a new date is selected (`multipleDatesAdded`) or an existing date is unselected (`multipleDatesRemoved`).

## global functions
To set dates programatically, call `$(".jsCalendar").calendar().setDates(start, end)`, where `start` and `end` are Date objects representing the dates you want to set. If you pass `null` as parameter, the corresponding date selection is removed.

To reset the selection programatically (e.g. with an extra button), you could trigger a `resetDates` event on the jsCalender HTML element.

From the user's perspective, range selection works like this: the first click is the start date, second click the end date, a third click resets the selection.
If the selected end date is before the start date, they are automatically exchanged. It is possible to deselect a start or end date by clicking it without resetting the whole selection. You can implement your own date selection algorithm by rewriting the `dateSelected` method.

To set the first day of the week (e.g: Sunday, Monday, ...) specify the attribute `data-firstdayofweek` at the jsCalender HTML element with a value between 0 and 6.

It is possible to display a specific month by calling `$(".jsCalendar").calendar().showMonth(date)`, where `date` is a Date object representing the desired month.

By default, it is not possible to select a date in the past, but a minimal date can be set with the attribute `data-mindate`. Also, there is no maximum selection date for the far future by default, but it can be set with the attribute `data-mindate`.

After initialization, the JavaScript Date object will be extended with a subset of instance methods from [datejs](http://www.datejs.com/): `clone`, `isLeapYear`, `getDaysInMonth`, `moveToFirstDayOfMonth`, `moveToLastDayOfMonth`, `addMilliseconds`, `addDays`, `addMonths` and `clearTime`.

The `$` function is extended with a `slice` method to select a range from a set of elements like this `$("a").slice(3, 7)`, using the native slice implementation for arrays. Another extension is the `calendar` method, returning the Calendar object belonging to the first matched HTML element, if available.

# Example

See [index.html](https://github.com/michaelkamphausen/jsCalendar/blob/master/index.html)

# Supported Platforms

* tested with Zepto.js:
  * Android
  * iOS
  * Safari
  * Chrome
* tested with jQuery
  * Android
  * iOS
  * Safari
  * Chrome
  * Firefox
  * Internet Explorer 7

# License

jsCalendar is licensed under the terms of the MIT License.
