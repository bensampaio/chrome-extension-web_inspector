var wi = {
	
	current : {
		active : false,
		dataBox : $(),
		element : $()
	},

	css : {
		ACTIVE : 'chrome-extension-wi-active',
		ELEMENT : 'chrome-extension-wi-element',
		CONTENT_BOX_CLASS : 'chrome-extension-wi-content_box',
		DATA_BOX_CLASS : 'chrome-extension-wi-data_box',
		DATA_FIELD : 'chrome-extension-wi-data_field',
		FILLER_BOX_CLASS : 'chrome-extension-wi-filler_box' 
	},

	elements : {
		CONTENT : [ 'ARTICLE', 'ASIDE', 'DIV', 'FIELDSET', 'FOOTER', 'FORM', 'HEADER', 'MAIN', 'NAV', 'OL', 'SECTION', 'TABLE', 'UL' ],
		FORM : [ 'BUTTON', 'INPUT', 'KEYGEN', 'OUTPUT', 'SELECT', 'TEXTAREA' ],
		GAME : [ 'CANVAS' ],
		MULTIMEDIA : [ 'AUDIO', 'IMG', 'VIDEO' ],
		REFERENCE : [ 'A', 'IFRAME', 'EMBED', 'OBJECT' ],
		TEXT : [ 
			'ABBR', 'ADDRESS', 
			'B', 'BDI', 'BDO', 'BLOCKQUOTE', 
			'CAPTION', 'CITE', 'CODE', 
			'DD', 'DEL', 'DFN', 'DIALOG', 'DT', 
			'EM', 
			'FIGCAPTION', 
			'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 
			'I', 'INS', 
			'LABEL', 'LEGEND', 'LI', 
			'MARK',
			'P', 'PRE',
			'Q',
			'S', 'SAMP', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUMMARY', 'SUP',
			'TIME', 'TH', 'TD',
			'U',
			'VAR'
		],

		clickEvent : function(domsToInspect) {
			domsToInspect
				.addClass(wi.css.ELEMENT)
				.on('click', function(event) {
					if(wi.current.active) {
						event.preventDefault();
						event.stopPropagation();

						// Remove existing box
						wi.removeDataBox();

						// Add new box
						wi.addDataBox($(this));
					}
				});
		}
	},

	init : function() {
		var selector = wi.elements.REFERENCE.join(',') + ',' + wi.elements.TEXT.join(',') + ',' + wi.elements.MULTIMEDIA.join(',');
		var containers = wi.elements.CONTENT.join(',');
		var filter = ':not(:has(' + containers + '))';

		// Remove Data Box when user clicks outside
		$(document)
			.on('click', function(event) {
				if(wi.current.active) {
					wi.removeDataBox();
				}
			})
			.on('DOMNodeInserted', function(event) {
				var domCreated = $(event.target);
				var domsToInspect = $();

				if(!domCreated.hasClass(wi.css.CONTENT_BOX_CLASS)) {
					if(!domCreated.hasClass(wi.css.ELEMENT) && domCreated.is(selector) && domCreated.find(containers).length == 0) {
						domsToInspect = domsToInspect.add(domCreated);
					}

					domsToInspect = domsToInspect.add(domCreated.find(selector).filter(filter).filter(':not(.' + wi.css.ELEMENT + ')'));

					wi.elements.clickEvent(domsToInspect);
				}
				
			});

		// Move Data Box on scroll
		$(window).on('resize scroll', function(event) {
			if(wi.current.active && wi.current.dataBox.length > 0 && wi.current.element.length > 0) {
				wi.setDataBoxStyles(wi.current.dataBox, wi.current.element);
			}
		});

		// Set Elements click event
		wi.elements.clickEvent($(selector).filter(filter));
	},

	addDataBox : function(domToInspect) {
		var contentBox = $('<div class="' + wi.css.CONTENT_BOX_CLASS + '"></div>');
		var dataBox = $('<div class="' + wi.css.DATA_BOX_CLASS + '"></div>');
		var fillerBox = $('<div class="' + wi.css.FILLER_BOX_CLASS + '"></div>');

		console.log(window.getComputedStyle(domToInspect[0]));

		var tagName = domToInspect[0].tagName;
		var metadata = [];

		// Set Data Box Content
		if(wi.elements.MULTIMEDIA.indexOf(tagName) != -1) {
			metadata = wi.getMultimediaMetadata(domToInspect);
		}
		else if(wi.elements.REFERENCE.indexOf(tagName) != -1) {
			metadata = wi.getReferenceMetadata(domToInspect);
		}
		else if(wi.elements.TEXT.indexOf(tagName) != -1) {
			metadata = wi.getTextMetadata(domToInspect);
		}

		var htmlMetadata = '<form>';
		for(var i = 0; i < metadata.length; i++) {
			var field = metadata[i];
			if(field.value) {
				htmlMetadata+= 
					'<div class="' + wi.css.DATA_FIELD + '">' +
						'<label for="' + field.id + '">' + field.label + ':</label>' +
						(field.id.indexOf('src') != -1?
							'<a href="' + field.value + '" target="_blank">' + field.value + '</a>' :
							'<span>' + field.value + '</span>'
						) +
					'</div>';
			}
		}
		htmlMetadata+= '<form>';

		// Set Content Box Events
		contentBox.on('click', function(event) {
			event.stopPropagation();
		});

		// Add Data Box to the Content Box
		dataBox.append(htmlMetadata);
		contentBox.append(dataBox);
		contentBox.append(fillerBox);

		// Add Content Box to Document
		$('body').append(contentBox);

		// Set Content Box Styles
		wi.setDataBoxStyles(contentBox, domToInspect);

		wi.current.dataBox = contentBox;
		wi.current.element = domToInspect;
	},

	setDataBoxStyles : function(contentBox, domToInspect) {
		var dataBox = contentBox.children('.'+wi.css.DATA_BOX_CLASS);
		var fillerBox = contentBox.children('.'+wi.css.FILLER_BOX_CLASS);

		var windowWidth = $(window).outerWidth();
		var windowHeight = $(window).outerHeight();

		var elementWidth = domToInspect.outerWidth();
		var elementHeight = domToInspect.outerHeight();

		var boxWidth = parseInt(contentBox.css('min-width'), 10);
		boxWidth = (elementWidth > boxWidth? elementWidth : boxWidth);
		var boxBorder = parseInt(contentBox.css('border-width'), 10);

		// Set Content Box Width
		contentBox.css('width', boxWidth);

		var boxHeight = elementHeight + contentBox.height();

		var elementPosition = domToInspect.offset();
		var boxPosition = {
			top : elementPosition.top - boxBorder,
			left : elementPosition.left - boxBorder,
			right : elementPosition.left + boxWidth + boxBorder,
			bottom : elementPosition.top + boxHeight + boxBorder
		};

		var contentBoxStyles = {};
		var dataBoxStyles = {};
		var fillerBoxStyles = {};

		// Set Horizontal Position
		if(boxPosition.right > windowWidth) {
			contentBoxStyles.left = 'initial';
			contentBoxStyles.right = windowWidth - (elementPosition.left + elementWidth + boxBorder);

			fillerBoxStyles.left = 0;
			fillerBoxStyles.right = 'initial';
		}
		else {
			contentBoxStyles.left = boxPosition.left;
			contentBoxStyles.right = 'initial';

			fillerBoxStyles.left = 'initial';
			fillerBoxStyles.right = 0;
		}

		// Set Vertical Position
		if(boxPosition.bottom > windowHeight) {
			contentBoxStyles.top = 'initial';
			contentBoxStyles.bottom = windowHeight - (elementPosition.top + elementHeight + boxBorder);

			dataBoxStyles.paddingTop = 0;
			dataBoxStyles.paddingBottom = boxBorder / 2;
			dataBoxStyles.marginTop = 0;
			dataBoxStyles.marginBottom = elementHeight;

			fillerBoxStyles.top = 'initial';
			fillerBoxStyles.bottom = 0;
		}
		else {
			contentBoxStyles.top = boxPosition.top;
			contentBoxStyles.bottom = 'initial';

			dataBoxStyles.paddingTop = boxBorder / 2;
			dataBoxStyles.paddingBottom = 0;
			dataBoxStyles.marginTop = elementHeight;
			dataBoxStyles.marginBottom = 0;

			fillerBoxStyles.top = 0;
			fillerBoxStyles.bottom = 'initial';
		}

		// Set Filler Box Width and Height
		if(boxWidth > elementWidth) {
			fillerBoxStyles.width = boxWidth - elementWidth;
			fillerBoxStyles.height = elementHeight;
			fillerBoxStyles.display = 'block';
		}
		else {
			fillerBoxStyles.display = 'none';
		}

		fillerBox.css(fillerBoxStyles);
		dataBox.css(dataBoxStyles);
		contentBox.css(contentBoxStyles);
	},

	getMultimediaMetadata : function(domToInspect) {
		var source = wi.utils.parseSourceURL(domToInspect[0].getAttribute('src') || domToInspect.children('source')[0].getAttribute('src'));

		return [
			{ id : 'width', label : chrome.i18n.getMessage("fieldWidthLabel"), value : domToInspect.width() + 'px' },
			{ id : 'height', label : chrome.i18n.getMessage("fieldHeightLabel"), value : domToInspect.height() + 'px' },
			{ id : 'src', label : chrome.i18n.getMessage("fieldSourceLabel"), value : source },
			{ id : 'desc', label : chrome.i18n.getMessage("fieldDescLabel"), value : domToInspect.attr('alt') }
		]
	},

	getReferenceMetadata : function(domToInspect) {
		var source = wi.utils.parseSourceURL(domToInspect[0].getAttribute('href') || domToInspect[0].getAttribute('src'));

		return wi.getTextMetadata(domToInspect).concat([
			{ id : 'src', label : chrome.i18n.getMessage("fieldSourceLabel"), value : source },
			{ id : 'lang', label : chrome.i18n.getMessage("fieldLangLabel"), value : domToInspect.attr('hreflang') }
		])
	},

	getTextMetadata : function(domToInspect) {
		var textColor = wi.utils.parseColor(domToInspect.css('color'));
		var backgroundColor = wi.utils.parseColor(domToInspect.css('background-color'));
		var backgroundImage = wi.utils.parseBackgroundImage(domToInspect.css('background-image'));

		return [
			{ id : 'font', label : chrome.i18n.getMessage("fieldFontLabel"), value : domToInspect.css('font-family') },
			{ id : 'fsize', label : chrome.i18n.getMessage("fieldFSizeLabel"), value : domToInspect.css('font-size') },
			{ id : 'text-color', label : chrome.i18n.getMessage("fieldTextColorLabel"), value : textColor },
			{ id : 'background-color', label : chrome.i18n.getMessage("fieldBackgroundColorLabel"), value : backgroundColor },
			{ id : 'image-src', label : chrome.i18n.getMessage("fieldBackgroundImageLabel"), value : backgroundImage }
		]
	},

	removeDataBox : function() {
		wi.current.dataBox.remove();
		wi.current.element = $();
	},

	toggleStatus : function() {
		wi.current.active = !wi.current.active;

		if(wi.current.active) {
			$('body').addClass(wi.css.ACTIVE);
		}
		else {
			$('body').removeClass(wi.css.ACTIVE);
			wi.removeDataBox();
		}
	},

	utils : {

		parseColor : function(str) {
			return str == 'transparent'? '' : str;
		},

		parseBackgroundImage : function(str) {
			return str == 'none'? '' : this.parseSourceURL(str.replace('url(','').replace(')',''))
		},

		parseSourceURL : function(str) {
			if(str && str.indexOf('://') == -1) {
				str = window.location.protocol + '//' + window.location.host + (window.location.port? ':' + window.location.port : '' ) + '/' + str;
			}

			return str;
		}

	}

};

wi.init();