(function() {
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
        currentMonth,
        today,
        minDate,
        dateInfo,
        singleDate,
        firstDayOfWeek = 0,
        tap = 'click',
        noAnimEnd = "noAnimationEnd",
        animEnd = Modernizr.csstransforms3d ? "webkit moz o ms khtml ".split(" ").join("AnimationEnd ") + "animationEnd" : noAnimEnd,
        startDateString = "startDate",
        endDateString = "endDate",
    
        setDate = function (type, value) {
            value && value.clearTime && value.clearTime();
            if (type == startDateString) {
                startDate = value;
            } else {
                endDate = value;
            }
            drawSelection();
            $calendar.data(type.toLowerCase(), !value ? "" : value.toString());
            $calendar.trigger(type + "Changed");
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
            $days.removeClass(startDateString).removeClass(endDateString).removeClass("betweenDates");
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
            minDate = today;
            startDate = $calendar.data("startdate");
            startDate = startDate ? new Date(startDate).clearTime() : null;
            endDate = $calendar.data("enddate");
            endDate = endDate ? new Date(endDate).clearTime() : null;
            currentMonth = (startDate || today).clone();
            
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
                $days.closest("table").addClass("turndown").bind(animEnd, function (evt) {
                    $(this).removeClass("turndown").unbind(animEnd);
                    $page.remove();
                    nextAnimation();
                }).trigger(noAnimEnd);
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
            });
            
            $days.bind(tap, dateSelected);
            
            self.showMonth(currentMonth);
        }
        
        self.setDates = function(start, end) {
            setDate(startDateString, start && end ? new Date(Math.min(start, end)) : start);
            !singleDate && setDate(endDateString, start && end ? 
                (start.getTime() != end.getTime() ? new Date(Math.max(start, end)) : null) : end);
        }
    
        self.showMonth = function (date) {
            minDate = new Date(Math.max(minDate, today));
        
            if (!!dateInfo) {
                $month.text(dateInfo.months.names["long"][date.getMonth()] + " " + date.getFullYear());
                for (var i = 0, maxI = $weekdays.length; i < maxI; i++) {
                    $weekdays.eq(getDay(i)).text(dateInfo.days.names.min[i]);
                }
            }
            
            var beforeMinDate = minDate > date.clone().moveToLastDayOfMonth();
            var includesToday = !beforeMinDate && (minDate >= date.clone().moveToFirstDayOfMonth());
            var minDay = minDate.getDate();
            
            $days.addClass("noTransition").removeClass("inactive");
            $rows.removeClass("last").removeClass("hidden");
            for (var firstDay = getDay(date.clone().moveToFirstDayOfMonth().getDay()) - 1, lastDay = firstDay + date.clone().moveToLastDayOfMonth().getDate(), i = 0, maxI = $days.length; i < maxI; i++) {
                var isDay = (i > firstDay) && (i <= lastDay);
                var $day = $days.eq(i).text(isDay ? ("" + (i - firstDay)) : "");
                if (isDay && (beforeMinDate || (includesToday && (i - firstDay < minDay)))) {
                    $day.addClass("inactive");
                }
                if (includesToday && today.getDate() == (i - firstDay)) {
                    $day.addClass("today");
                }
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
})()