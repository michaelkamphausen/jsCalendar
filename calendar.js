/*
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

	By default, it is not possible to select a date in the past, but a minimal date can be set with the attribute `data-mindate`. Also, there is no maximum selection date for the far future by default, but it can be set with the attribute `data-maxdate` (also accepts the value `today`).

	After initialization, the JavaScript Date object will be extended with a subset of instance methods from [datejs](http://www.datejs.com/): `clone`, `isLeapYear`, `getDaysInMonth`, `moveToFirstDayOfMonth`, `moveToLastDayOfMonth`, `addMilliseconds`, `addDays`, `addMonths` and `clearTime`.

	The `$` function is extended with a `slice` method to select a range from a set of elements like this `$("a").slice(3, 7)`, using the native slice implementation for arrays. Another extension is the `calendar` method, returning the Calendar object belonging to the first matched HTML element, if available.

	# Example

	See [index.html](https://github.com/philipvonbargen/jsCalendar/blob/master/index.html)

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
*/

(function(window) {
	var document = window.document;

	$(document).ready(function() {
		var $calendars = $(".jsCalendar");
		for (var i = 0, maxI = $calendars.length; i < maxI; i++) {
			var calendar = new Calendar();
			calendar.ready($calendars.eq(i));
		}
	});

	function Calendar() {
		var self = this,
		$calendar,
		$previous,
		$next,
		$month,
		$weekdays,
		$days,
		$rows,
		startDate,
		endDate,
		multipleDatesArray = {},
		currentMonth,
		today,
		minDate,
		maxDate,
		dateInfo,
		singleDate,
		multipleDates,
		multipleDatesMax,
		firstDayOfWeek = 0,
		tap = 'click',
		noAnimEnd = "noAnimationEnd",
		animEnd = typeof Modernizr !== 'undefined' && Modernizr.csstransforms3d ? "webkitAnimationEnd oanimationend MSAnimationEnd animationend" : noAnimEnd,
		startDateString = "startDate",
		endDateString = "endDate",
		multipleDatesString = "multipleDates",

		dateInArray = function(needle, haystack) {
			for(var i = 0, iMax = haystack.length; i < iMax; i++) {
				if (needle && haystack[i] && needle.getTime() === haystack[i].getTime()) {
					return i;
				}
			}

			return -1;
		},

		setDate = function (type, value) {
			value && value.clearTime && value.clearTime();
			if (type == multipleDatesString) {
				var dateAdded = false;

				if (value === null) {
					multipleDatesArray = [];
				} else {
					var i = dateInArray(value, multipleDatesArray);
					if (i !== -1) {
						multipleDatesArray.splice(i, 1);
					} else {
						if ( multipleDatesMax !== null && multipleDatesArray.length >= ~~multipleDatesMax ) {
							return false;
						} else {
							multipleDatesArray.push(value);
							dateAdded = true;
						}
					}
				}
				$calendar
					.data(type.toLowerCase(), JSON.stringify(multipleDatesArray))
					.trigger(type + "Changed", {dates: multipleDatesArray, changedDate: value})
					.trigger(type + (dateAdded ? "Added" : "Removed"), {dates: multipleDatesArray, changedDate: value})
				;
			} else {
				if (type == startDateString) {
					startDate = value;
				} else {
					endDate = value;
				}
				$calendar.data(type.toLowerCase(), !value ? "" : value.toString());
				$calendar.trigger(type + "Changed");
			}
			drawSelection();
		},

		dateSelected = function (evt) {
			evt.preventDefault();
			var $this = $(this);
			if ($this.hasClass("inactive") || ($this.text().length == 0)) {
				return;
			}
			var selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), parseInt($this.text()));
			if (singleDate) {
				setDate(startDateString, !startDate || (selectedDate.getTime() != startDate.getTime()) ? selectedDate : null);
				return;
			} else if (multipleDates) {
				setDate(multipleDatesString, selectedDate);
				return;
			}
			if (!startDate) {
				if (!endDate) {
					setDate(startDateString, selectedDate);
				} else {
					if (selectedDate < endDate) {
						setDate(startDateString, selectedDate);
					} else if (endDate < selectedDate) {
						setDate(startDateString, endDate);
						setDate(endDateString, selectedDate);
					} else {
						setDate(endDateString, null);
					}
				}
			} else if (!endDate) {
				if (startDate < selectedDate) {
					setDate(endDateString, selectedDate);
				} else if (selectedDate < startDate) {
					setDate(endDateString, startDate);
					setDate(startDateString, selectedDate);
				} else {
					setDate(startDateString, null);
				}
			} else {
				if ($this.hasClass(startDateString)) {
					setDate(startDateString, null);
				} else if ($this.hasClass(endDateString)) {
					setDate(endDateString, null);
				} else {
					setDate(startDateString, null);
					setDate(endDateString, null);
				}
			}
		},

		extendDate = function () {
			/* subset from date.js, http://www.datejs.com/ */
			Date.prototype.clone=function(){return new Date(this.getTime());}
			Date.prototype.isLeapYear=function(){var y=this.getFullYear();return(((y%4===0)&&(y%100!==0))||(y%400===0));}
			Date.prototype.getDaysInMonth=function(){return [31,(this.isLeapYear(this.getFullYear())?29:28),31,30,31,30,31,31,30,31,30,31][this.getMonth()];}
			Date.prototype.moveToFirstDayOfMonth=function(){this.setDate(1);return this;}
			Date.prototype.moveToLastDayOfMonth=function(){this.setDate(this.getDaysInMonth());return this;}
			Date.prototype.addMilliseconds=function(value){this.setMilliseconds(this.getMilliseconds()+value);return this;}
			Date.prototype.addDays=function(value){return this.addMilliseconds(value*86400000);}
			Date.prototype.addMonths=function(value){var n=this.getDate();this.setDate(1);this.setMonth(this.getMonth()+value);this.setDate(Math.min(n,this.getDaysInMonth()));return this;}
			Date.prototype.clearTime=function(){this.setHours(0);this.setMinutes(0);this.setSeconds(0);this.setMilliseconds(0);return this;}
		},

		getDay = function (day) {
			return (day + firstDayOfWeek) % 7; // changing first day of week
		},

		drawSelection = function () {
			$days.removeClass(startDateString).removeClass(endDateString).removeClass(multipleDatesString).removeClass("betweenDates");
			var firstDay = currentMonth.clone().moveToFirstDayOfMonth();
			var lastDay = currentMonth.clone().moveToLastDayOfMonth();
			var dayOffset = getDay(firstDay.getDay()) - 1;

			if (!!startDate && !!endDate && (startDate < lastDay) && (endDate > firstDay)) {
				var firstBetweenDay = new Date(Math.max(firstDay, startDate.clone().addDays(1)));
				var lastBetweenDay = new Date(Math.min(lastDay, endDate.clone().addDays(-1)));
				if (firstBetweenDay <= lastBetweenDay) {
					$days.slice(dayOffset + firstBetweenDay.getDate(), dayOffset + lastBetweenDay.getDate() + 1).addClass("betweenDates");
				}
			}
			if (!!startDate && (firstDay <= startDate) && (startDate <= lastDay)) {
				$days.eq(dayOffset + startDate.getDate()).addClass(startDateString);
			}
			if (!!endDate && (firstDay <= endDate) && (endDate <= lastDay)) {
				$days.eq(dayOffset + endDate.getDate()).addClass(endDateString);
			}
			for(var i in multipleDatesArray) {
				if (!!multipleDatesArray[i] && (firstDay <= multipleDatesArray[i]) && (multipleDatesArray[i] <= lastDay)) {
					$days.eq(dayOffset + multipleDatesArray[i].getDate()).addClass(multipleDatesString);
				}
			}
		};

		self.ready = function ($element) {
			$calendar = $element;
			$previous = $('<a href="#">&lt;</a>');
			$next = $('<a href="#">&gt;</a>');
			$month = $('<li class="calMonth"></li>');
			$calendar.append($('<ul class="calButtonBar"></ul>')
				.append($('<li class="calPrevious"></li>').append($previous))
				.append($month)
				.append($('<li class="calNext"></li>').append($next))
			);
			for (var i = 0, th = "", td = ""; i < 7; i++) {
			  th += '<th></th>';
			  td += '<td><a href="#"></a></td>';
			}
			for (var i = 0, tr = ""; i < 6; i++) {
			  tr += '<tr>' + td + '</tr>';
			}
			$calendar.append('<div class="calGrid"><table><tr>' + th + '</tr>' + tr + '</table></div>');
			$weekdays = $calendar.find("th");
			$days = $calendar.find("td a");
			$rows = $calendar.find("tr");
			$rows.eq(1).addClass("first");

			singleDate = $calendar.hasClass("jsSingleDate");
			multipleDates = $calendar.hasClass("jsMultipleDates");
			multipleDatesMax = $calendar.data("multipledates-max") || null;
			firstDayOfWeek = $calendar.data("firstdayofweek") || firstDayOfWeek;

			$calendar.get(0).calendar = self;
			if ($.fn) {
				$.fn.slice = $.fn.slice || function (start, end) {
					return $([].slice.call(this, start, end));
				}
				$.fn.calendar = function() {
					return this.get(0).calendar;
				}
			}

			extendDate();
			today = (new Date()).clearTime();
			minDate = $calendar.data("mindate") ? new Date($calendar.data("mindate")).clearTime() : today;
			maxDate = $calendar.data("maxdate") ? ($calendar.data("maxdate").trim() == "today" ? today : new Date($calendar.data("maxdate")).clearTime()) : false;
			startDate = $calendar.data("startdate");
			startDate = startDate ? new Date(startDate).clearTime() : null;
			endDate = $calendar.data("enddate");
			endDate = endDate ? new Date(endDate).clearTime() : null;

			multipleDatesArray = $calendar.data("multipledates");
			if (typeof multipleDatesArray == "string") {
				multipleDatesArray = JSON.parse(multipleDatesArray);
			}
			for(var i in multipleDatesArray) {
				multipleDatesArray[i] = new Date(multipleDatesArray[i]).clearTime();

			}

			currentMonth = (startDate || (multipleDatesArray ? multipleDatesArray[0] : false) || today).clone();

			dateInfo = $calendar.data("localized_date");
			if (typeof dateInfo == "string") {
				dateInfo = JSON.parse(dateInfo);
			}

			var $monthGrid = $calendar.find(".calGrid");
			var animationQueue = [];
			var isAnimating = function(node) {
				if ($monthGrid.children().length > 1) {
					animationQueue.push(node);
					return true;
				}
				return false;
			}
			var nextAnimation = function() {
				if (animationQueue.length > 0) {
					setTimeout(function() {
						animationQueue.shift().trigger(tap);
					}, 0);
				}
			}
			$previous.bind(tap, function (evt) {
				evt.preventDefault();
				if (isAnimating($previous)) return;
				currentMonth = currentMonth.addMonths(-1);
				var $page = $('<table>' + $calendar.find("table").html() + '</table>');
				$monthGrid.append($page);
				$days.closest("table").bind(animEnd, function (evt) {
					$(this).removeClass("turndown").unbind(animEnd);
					$page.remove();
					nextAnimation();
				}).addClass("turndown").trigger(noAnimEnd);
				self.showMonth(currentMonth);
			});
			$next.bind(tap, function (evt) {
				evt.preventDefault();
				if (isAnimating($next)) return;
				currentMonth = currentMonth.addMonths(+1);
				var $page = $('<table class="turnup">' + $calendar.find("table").html() + '</table>');
				$monthGrid.append($page);
				$page.bind(animEnd, function (evt) {
					$page.remove();
					nextAnimation();
				}).trigger(noAnimEnd);
				self.showMonth(currentMonth);
			});

			$calendar.bind("resetDates", function (evt) {
				setDate(startDateString, null);
				setDate(endDateString, null);
				multipleDates && setDate(multipleDatesString, null);
			});

			$days.bind(tap, dateSelected);

			self.showMonth(currentMonth);
		}

		self.setDates = function(start, end) {
			if (multipleDates) {
				start = (start && start.constructor === Array) ? start : [start];
				for (var i = 0, iMax = start.length; i < iMax; i++) {
					setDate(multipleDatesString, start[i]);
				}
			} else {
				setDate(startDateString, start && end ? new Date(Math.min(start, end)) : start);
				!singleDate && setDate(endDateString, start && end ?
					(start.getTime() != end.getTime() ? new Date(Math.max(start, end)) : null) : end);
			}
		}

		self.showMonth = function (date) {
			if (!!dateInfo) {
				$month.text(dateInfo.months.names["long"][date.getMonth()] + " " + date.getFullYear());
				for (var i = 0, maxI = $weekdays.length; i < maxI; i++) {
					$weekdays.eq(getDay(i)).text(dateInfo.days.names.min[i]);
				}
			}
			var beforeMinDate = minDate > date.clone().moveToLastDayOfMonth();
			var afterMaxDate = maxDate ? maxDate < date.clone().moveToFirstDayOfMonth() : false;
			var includesMinDate = (minDate.clone().moveToFirstDayOfMonth() - date.clone().moveToFirstDayOfMonth() === 0 );
			var includesMaxDate = maxDate ? (maxDate.clone().moveToFirstDayOfMonth() - date.clone().moveToFirstDayOfMonth() === 0 ) : false;
			var includesToday = (today.clone().moveToFirstDayOfMonth() - date.clone().moveToFirstDayOfMonth() === 0 );
			var minDay = minDate.getDate();
			var maxDay = maxDate && maxDate.getDate();
			$days.addClass("noTransition").removeClass("inactive");
			$rows.removeClass("last").removeClass("hidden");
			for (var firstDay = getDay(date.clone().moveToFirstDayOfMonth().getDay()) - 1, lastDay = firstDay + date.clone().moveToLastDayOfMonth().getDate(), i = 0, maxI = $days.length; i < maxI; i++) {
				var isDay = (i > firstDay) && (i <= lastDay);
				var $day = $days.eq(i).text(isDay ? ("" + (i - firstDay)) : "");
				$day.toggleClass("noDate", (!isDay));
				$day.toggleClass("inactive", isDay && (
					(beforeMinDate || (includesMinDate && (i - firstDay < minDay))) ||
					(afterMaxDate || (includesMaxDate && (i - firstDay > maxDay)))
				));
				$day.toggleClass("today", (includesToday && today.getDate() == (i - firstDay)));
				if (i == lastDay) {
					$day.closest("tr").addClass("last").next().addClass("hidden").next().addClass("hidden");
				}
			}
			setTimeout(function() {
				$days.removeClass("noTransition");
			}, 0);
			drawSelection();
		}
	}

	window.Calendar = window.Calendar || Calendar;
})(window);
