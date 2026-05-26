$(function () {
	// DOM ready pattern: kod yalnız HTML yüklənəndən sonra işləyir.
	// Bu, elementlər mövcud olmadan onlara müraciət etməyin qarşısını alır.
	function escapeHtml(value) {
		// XSS-dən qorunma: xarici API mətnini təhlükəsiz HTML string-ə çeviririk.
		return $("<div>").text(value == null ? "" : String(value)).html();
	}
    
	function buildStars(starCount) {
		// Deterministik render: eyni input -> eyni output prinsipi ilə UI qurulur.
		var starsHtml = "";
		var rating = Math.max(0, Math.min(5, parseInt(starCount, 10) || 0));

		for (var i = 1; i <= 5; i += 1) {
			starsHtml +=
				'<img src="images/star_' +
				(i <= rating ? "on" : "off") +
				'.png" alt="star ' +
				(i <= rating ? "on" : "off") +
				'" width="15px" />';
		}

		return starsHtml;
	}

	function renderVideoSlide(video, index) {
		// Templating yanaşması: obyektdən HTML string yaradıb sonra DOM-a yerləşdiririk.
		return (
			'<div class="carousel-item' +
			(index === 0 ? " active" : "") +
			'">' +
			'<div class="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">' +
			'<div class="card">' +
			'<img src="' +
			escapeHtml(video.thumb_url) +
			'" class="card-img-top" alt="Video thumbnail" />' +
			'<div class="card-img-overlay text-center">' +
			'<img src="images/play.png" alt="Play" width="64px" class="align-self-center play-overlay" />' +
			"</div>" +
			'<div class="card-body">' +
			'<h5 class="card-title font-weight-bold">' +
			escapeHtml(video.title) +
			"</h5>" +
			'<p class="card-text text-muted">' +
			escapeHtml(video["sub-title"]) +
			"</p>" +
			'<div class="creator d-flex align-items-center">' +
			'<img src="' +
			escapeHtml(video.author_pic_url) +
			'" alt="Creator profile" width="30px" class="rounded-circle" />' +
			'<h6 class="pl-3 m-0 main-color">' +
			escapeHtml(video.author) +
			"</h6>" +
			"</div>" +
			'<div class="info pt-3 d-flex justify-content-between">' +
			'<div class="rating">' +
			buildStars(video.star) +
			"</div>" +
			'<span class="main-color">' +
			escapeHtml(video.duration) +
			"</span>" +
			"</div>" +
			"</div>" +
			"</div>" +
			"</div>" +
			"</div>"
		);
	}

	function initCardByCardCarousel(carouselSelector, visibleCardsOnDesktop) {
		// Multi-item carousel məntiqi: qonşu kartları clone edib bir slaydda göstəririk.
		var $carousel = $(carouselSelector);
		var $items = $carousel.find(".carousel-item");

		$items.each(function () {
			var $item = $(this);
			var $next = $item.next();

			for (var i = 1; i < visibleCardsOnDesktop; i += 1) {
				if (!$next.length) {
					$next = $items.first();
				}

				$next.children(":first-child").clone().appendTo($item);
				$next = $next.next();
			}
		});
	}

	function loadCarousel(options) {
		// Reusable abstraction: fərqli endpoint-lər üçün eyni Ajax lifecycle istifadə olunur.
		var $loader = $(options.loaderSelector);
		var $carousel = $(options.carouselSelector);

		if (!$loader.length || !$carousel.length) {
			return;
		}

		var $carouselInner = $carousel.find(".carousel-inner");

		$.ajax({
			url: options.url,
			method: "GET",
			dataType: "json",
			beforeSend: function () {
				// UX prinsipi: request gedərkən loader göstər, hazır kontenti gizlət.
				$loader.show();
				$carousel.addClass("d-none");
			},
			success: function (items) {
				// Defensive coding: gələn datanın array olub-olmadığını yoxlayırıq.
				var list = Array.isArray(items) ? items : [];
				var slidesHtml = "";

				list.forEach(function (item, index) {
					slidesHtml += options.renderSlide(item, index);
				});

				if (!slidesHtml) {
					slidesHtml = options.emptyHtml;
				}

				$carouselInner.html(slidesHtml);

				if (typeof options.afterRender === "function") {
					options.afterRender($carousel);
				}

				$loader.hide();
				$carousel.removeClass("d-none");
				$carousel.carousel();
			},
			error: function () {
				// Graceful degradation: API xətasında da istifadəçiyə fallback mesaj göstərilir.
				$carouselInner.html(options.errorHtml);
				$loader.hide();
				$carousel.removeClass("d-none");
			},
		});
	}

	function toLabel(value) {
		// Data normalization: API dəyərlərini UI-friendly label formasına salırıq.
		if (!value) {
			return "";
		}

		return String(value)
			.replace(/_/g, " ")
			.replace(/\b\w/g, function (c) {
				return c.toUpperCase();
			});
	}

	function renderCourseCard(course) {
		// Presentational function: kurs obyektini vizual karta çevirir.
		return (
			'<div class="col-12 col-sm-4 col-lg-3 d-flex justify-content-center">' +
			'<div class="card">' +
			'<img src="' +
			escapeHtml(course.thumb_url) +
			'" class="card-img-top" alt="Video thumbnail" />' +
			'<div class="card-img-overlay text-center">' +
			'<img src="images/play.png" alt="Play" width="64px" class="align-self-center play-overlay" />' +
			"</div>" +
			'<div class="card-body">' +
			'<h5 class="card-title font-weight-bold">' +
			escapeHtml(course.title) +
			"</h5>" +
			'<p class="card-text text-muted">' +
			escapeHtml(course["sub-title"]) +
			"</p>" +
			'<div class="creator d-flex align-items-center">' +
			'<img src="' +
			escapeHtml(course.author_pic_url) +
			'" alt="Creator profile" width="30px" class="rounded-circle" />' +
			'<h6 class="pl-3 m-0 main-color">' +
			escapeHtml(course.author) +
			"</h6>" +
			"</div>" +
			'<div class="info pt-3 d-flex justify-content-between">' +
			'<div class="rating">' +
			buildStars(course.star) +
			"</div>" +
			'<span class="main-color">' +
			escapeHtml(course.duration) +
			"</span>" +
			"</div>" +
			"</div>" +
			"</div>" +
			"</div>"
		);
	}

	function initCoursesPage() {
		// State management (sadə): filter dəyərlərini local state obyektində saxlayırıq.
		var $keywordsInput = $("#courses-keywords");
		var $topicMenu = $("#topicMenu");
		var $sortMenu = $("#sortMenu");
		var $topicToggleText = $("#topicDropdown span");
		var $sortToggleText = $("#sortDropdown span");
		var $results = $(".courses-results");
		var $loader = $("#courses-loader");
		var $videoCount = $(".video-count");

		if (
			!$keywordsInput.length ||
			!$topicMenu.length ||
			!$sortMenu.length ||
			!$results.length ||
			!$loader.length
		) {
			return;
		}

		var state = {
			q: "",
			topic: "all",
			sort: "most_popular",
		};
		var debounceTimer;

		function renderDropdown($menu, $toggleText, values, selectedValue, onSelect) {
			// Event delegation: dinamik yaradılan dropdown item-lara click handler bağlanır.
			var menuHtml = "";

			(values || []).forEach(function (value) {
				menuHtml +=
					'<a class="dropdown-item" href="#" data-value="' +
					escapeHtml(value) +
					'">' +
					escapeHtml(toLabel(value)) +
					"</a>";
			});

			$menu.html(menuHtml);
			$toggleText.text(toLabel(selectedValue));

			$menu.off("click", ".dropdown-item");
			$menu.on("click", ".dropdown-item", function (event) {
				event.preventDefault();
				onSelect($(this).data("value"));
			});
		}

		function fetchCourses() {
			// Parametrli query: q/topic/sort dəyərləri backend filtrinə göndərilir.
			$.ajax({
				url: "https://smileschool-api.hbtn.info/courses",
				method: "GET",
				dataType: "json",
				data: {
					q: state.q,
					topic: state.topic,
					sort: state.sort,
				},
				beforeSend: function () {
					$loader.show();
					$results.addClass("d-none");
				},
				success: function (response) {
					// Single source of truth: UI hər dəfə API cavabına əsasən yenilənir.
					var courses = response && response.courses ? response.courses : [];

					state.q = response && response.q != null ? response.q : state.q;
					state.topic = response && response.topic ? response.topic : state.topic;
					state.sort = response && response.sort ? response.sort : state.sort;

					$keywordsInput.val(state.q);
					$videoCount.text(courses.length + " videos");

					renderDropdown(
						$topicMenu,
						$topicToggleText,
						response.topics,
						state.topic,
						function (value) {
							state.topic = value;
							fetchCourses();
						}
					);

					renderDropdown(
						$sortMenu,
						$sortToggleText,
						response.sorts,
						state.sort,
						function (value) {
							state.sort = value;
							fetchCourses();
						}
					);

					$results.html(courses.map(renderCourseCard).join(""));
					$loader.hide();
					$results.removeClass("d-none");
				},
				error: function () {
					$videoCount.text("0 videos");
					$results.html(
						'<div class="col-12 text-center text-muted">Unable to load courses.</div>'
					);
					$loader.hide();
					$results.removeClass("d-none");
				},
			});
		}

		$keywordsInput.on("input", function () {
			// Debounce: hər klavişdə request atmaq əvəzinə qısa gecikmə ilə optimallaşdırırıq.
			state.q = $(this).val();
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(fetchCourses, 300);
		});

		fetchCourses();
	}

	loadCarousel({
		loaderSelector: "#quotes-loader",
		carouselSelector: "#carouselExampleControls",
		url: "https://smileschool-api.hbtn.info/quotes",
		renderSlide: function (quote, index) {
			return (
				'<div class="carousel-item' +
				(index === 0 ? " active" : "") +
				'">' +
				'<div class="row mx-auto align-items-center">' +
				'<div class="col-12 col-sm-2 col-lg-2 offset-lg-1 text-center">' +
				'<img src="' +
				escapeHtml(quote.pic_url) +
				'" class="d-block align-self-center" alt="' +
				escapeHtml(quote.name) +
				'" />' +
				"</div>" +
				'<div class="col-12 col-sm-7 offset-sm-2 col-lg-9 offset-lg-0">' +
				'<div class="quote-text">' +
				'<p class="text-white">' +
				escapeHtml(quote.text) +
				"</p>" +
				'<h4 class="text-white font-weight-bold">' +
				escapeHtml(quote.name) +
				"</h4>" +
				'<span class="text-white">' +
				escapeHtml(quote.title) +
				"</span>" +
				"</div>" +
				"</div>" +
				"</div>" +
				"</div>"
			);
		},
		emptyHtml:
			'<div class="carousel-item active"><div class="row mx-auto align-items-center"><div class="col-12 text-center text-white">No quotes available.</div></div></div>',
		errorHtml:
			'<div class="carousel-item active"><div class="row mx-auto align-items-center"><div class="col-12 text-center text-white">Unable to load quotes.</div></div></div>',
	});

	loadCarousel({
		loaderSelector: "#popular-loader",
		carouselSelector: "#carouselExampleControls2",
		url: "https://smileschool-api.hbtn.info/popular-tutorials",
		renderSlide: renderVideoSlide,
		afterRender: function ($carousel) {
			initCardByCardCarousel("#" + $carousel.attr("id"), 4);
		},
		emptyHtml:
			'<div class="carousel-item active"><div class="col-12 text-center text-muted">No tutorials available.</div></div>',
		errorHtml:
			'<div class="carousel-item active"><div class="col-12 text-center text-muted">Unable to load tutorials.</div></div>',
	});

	loadCarousel({
		loaderSelector: "#latest-loader",
		carouselSelector: "#carouselExampleControls3",
		url: "https://smileschool-api.hbtn.info/latest-videos",
		renderSlide: renderVideoSlide,
		afterRender: function ($carousel) {
			initCardByCardCarousel("#" + $carousel.attr("id"), 4);
		},
		emptyHtml:
			'<div class="carousel-item active"><div class="col-12 text-center text-muted">No videos available.</div></div>',
		errorHtml:
			'<div class="carousel-item active"><div class="col-12 text-center text-muted">Unable to load videos.</div></div>',
	});

	initCoursesPage();
});


