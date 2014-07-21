var wi = {

	css : {
		ELEMENT : 'chrome-extension-wi-element',
		CLOSE_BUTTON : 'chrome-extension-wi-close_button',
		CONTENT_BOX_CLASS : 'chrome-extension-wi-content_box',
		DATA_BOX_CLASS : 'chrome-extension-wi-data_box',
		DATA_FIELD : 'chrome-extension-wi-data_field',
		FILLER_BOX_CLASS : 'chrome-extension-wi-filler_box' 
	},
	
	current : {
		active : false,
		contentBox : $(),
		element : $(),
		elements : $(),

		addElements : function(newElements) {
			if(newElements.length > 0) {
				newElements.addClass(wi.css.ELEMENT).on('click', wi.events.elementClick);
				this.elements = this.elements.add(newElements);
			}
		},

		resetElements : function() {
			this.elements.removeClass(wi.css.ELEMENT).off('click', wi.events.elementClick);
			this.elements = $();
		},

		toggleStatus : function() {
			var toggleEvent = '';
			var elementsLogic = wi.elements;

			// Change Application Status
			this.active = !this.active;

			if(this.active) {
				toggleEvent = 'on';
				this.addElements($(elementsLogic.selector).filter(elementsLogic.filter));
			}
			else {
				toggleEvent = 'off';
				this.resetElements();
				wi.box.remove();
			}

			// Remove Data Box when user clicks outside
			$(document)
				[toggleEvent]('click', wi.events.documentClicked)
				[toggleEvent]('DOMNodeInserted', wi.events.elementCreated);

			// Move Data Box on scroll
			$(window)
				[toggleEvent]('keydown', wi.events.keyPress)
				[toggleEvent]('resize scroll', wi.events.windowResizeOrScroll);
		}
	},

	elements : {
		selector : '',
		containers : '',
		filter : '',

		CONTENT : [ 'ARTICLE', 'ASIDE', 'DIV', 'FIELDSET', 'FOOTER', 'FORM', 'HEADER', 'MAIN', 'NAV', 'OL', 'SECTION', 'TABLE', 'UL' ],
		FORM : [ 'BUTTON', 'INPUT', 'KEYGEN', 'OUTPUT', 'SELECT', 'TEXTAREA' ],
		GAME : [ 'CANVAS' ],
		MULTIMEDIA : [ 'AUDIO', 'IMG', 'VIDEO' ],
		REFERENCE : [ 'A', 'IFRAME', 'EMBED', 'OBJECT' ],
		TEXT : [ 
			'ABBR', 'ADDRESS', 
			'B', 'BDI', 'BDO', 'BLOCKQUOTE', 
			'CAPTION', 'CITE', 'CODE', 
			'DD', 'DEL', 'DIV', 'DFN', 'DIALOG', 'DT', 
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

		init : function() {
			this.selector = this.REFERENCE.join(',') + ',' + this.TEXT.join(',') + ',' + this.MULTIMEDIA.join(',');
			this.containers = this.CONTENT.join(',');
			this.filter = ':not(:has(' + this.containers + '))';
		}
	},

	events : {

		documentClicked : function(event) {
			if(wi.current.active) {
				wi.box.remove();
			}
		},

		elementCreated : function(event) {
			if(wi.current.active) {
				var domCreated = $(event.target);
				var elementsLogic = wi.elements;

				if(!domCreated.hasClass(wi.css.CONTENT_BOX_CLASS)) {
					var newElements = domCreated.find(elementsLogic.selector).filter(elementsLogic.filter).filter(':not(.' + wi.css.ELEMENT + ')');

					// If the created DOM is a inspectable element and doesn't contain any containers
					if(!domCreated.hasClass(wi.css.ELEMENT) && domCreated.is(elementsLogic.selector) && domCreated.find(elementsLogic.containers).length == 0) {
						newElements = newElements.add(domCreated);
					}

					// Add new Elements to Current Elements List
					wi.current.addElements(newElements);
				}
			}
		},

		elementClick : function(event) {
			if(wi.current.active) {
				event.preventDefault();
				event.stopPropagation();

				// Remove existing box
				wi.box.remove();

				// Add new box
				wi.box.add($(event.target));
			}
		},

		keyPress : function(event) {
			console.log(event.keyCode);
			if(wi.current.active) {

				// If 'ESC' is pressed send request to the background page
				if(event.keyCode == 27) {
					chrome.extension.sendRequest({ 'action' : 'toggleIcon' });
				}
			}
		},

		windowResizeOrScroll : function(event) {
			if(wi.current.active && wi.current.contentBox.length > 0 && wi.current.element.length > 0) {
				wi.box.setStyles(wi.current.contentBox, wi.current.element);
			}
		}

	},

	box : {

		add : function(elementToInspect) {
			var contentBox = $('<div class="' + wi.css.CONTENT_BOX_CLASS + '"></div>');
			var dataBox = $('<div class="' + wi.css.DATA_BOX_CLASS + '"></div>');
			var fillerBox = $('<div class="' + wi.css.FILLER_BOX_CLASS + '"></div>');
			var closeButton = $('<div class="' + wi.css.CLOSE_BUTTON + '">X</div>');

			// Get Element Metadata
			var metadata = this.getMetadata(elementToInspect);

			// Set Data Box Content
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

			closeButton.on('click', wi.events.documentClicked);

			// Add Data Box to the Content Box
			dataBox.append(htmlMetadata);
			contentBox.append(closeButton);
			contentBox.append(dataBox);
			contentBox.append(fillerBox);

			// Add Content Box to Document
			$('body').append(contentBox);

			// Set Content Box Styles
			this.setStyles(contentBox, elementToInspect);

			wi.current.contentBox = contentBox;
			wi.current.element = elementToInspect;
		},

		getMetadata : function(elementToInspect) {
			var textMetadata = [];
			var refMetadata = [];
			var multimediaMetadata = [];

			var tagName = elementToInspect[0].tagName;
			var text = elementToInspect.text();
			var textColor = wi.utils.parseColor(elementToInspect.css('color'));
			var backgroundColor = wi.utils.parseColor(elementToInspect.css('background-color'));
			var backgroundImage = wi.utils.parseBackgroundImage(elementToInspect.css('background-image'));
			var href = wi.utils.parseSourceURL(elementToInspect.attr('href'));
			var source = wi.utils.parseSourceURL(elementToInspect.attr('src') || elementToInspect.children('source').attr('src'));

			// Set Text Metadata
			if(text && typeof text === 'string') {
				textMetadata = [
					{ id : 'font', label : chrome.i18n.getMessage("fieldFontLabel"), value : elementToInspect.css('font-family') },
					{ id : 'fsize', label : chrome.i18n.getMessage("fieldFSizeLabel"), value : elementToInspect.css('font-size') },
					{ id : 'text-color', label : chrome.i18n.getMessage("fieldTextColorLabel"), value : textColor },
					{ id : 'background-color', label : chrome.i18n.getMessage("fieldBackgroundColorLabel"), value : backgroundColor },
					{ id : 'image-src', label : chrome.i18n.getMessage("fieldBackgroundImageLabel"), value : backgroundImage }
				];
			}

			// Set Reference Metadata
			if(wi.elements.REFERENCE.indexOf(tagName) != -1) {
				refMetadata = [
					{ id : 'src', label : chrome.i18n.getMessage("fieldSourceLabel"), value : href || source },
					{ id : 'lang', label : chrome.i18n.getMessage("fieldLangLabel"), value : elementToInspect.attr('hreflang') }
				];
			}

			// Set Multimedia Metadata
			if(wi.elements.MULTIMEDIA.indexOf(tagName) != -1) {
				multimediaMetadata = [
					{ id : 'width', label : chrome.i18n.getMessage("fieldWidthLabel"), value : elementToInspect.width() + 'px' },
					{ id : 'height', label : chrome.i18n.getMessage("fieldHeightLabel"), value : elementToInspect.height() + 'px' },
					{ id : 'src', label : chrome.i18n.getMessage("fieldSourceLabel"), value : source },
					{ id : 'desc', label : chrome.i18n.getMessage("fieldDescLabel"), value : elementToInspect.attr('alt') }
				];
			}

			return [].concat(textMetadata).concat(refMetadata).concat(multimediaMetadata);
		},

		setStyles : function(contentBox, elementToInspect) {
			var dataBox = contentBox.children('.'+wi.css.DATA_BOX_CLASS);
			var fillerBox = contentBox.children('.'+wi.css.FILLER_BOX_CLASS);

			var windowWidth = $(window).outerWidth();
			var windowHeight = $(document).outerHeight();

			var elementWidth = elementToInspect.outerWidth();
			var elementHeight = elementToInspect.outerHeight();

			var boxWidth = parseInt(contentBox.css('min-width'), 10);
			boxWidth = (elementWidth > boxWidth? elementWidth : boxWidth);
			var boxBorder = parseInt(contentBox.css('border-width'), 10);

			// Set Content Box Width
			contentBox.css('width', boxWidth);

			var boxHeight = elementHeight + contentBox.height();

			var elementPosition = elementToInspect.offset();
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


		remove : function() {
			wi.current.contentBox.remove();
			wi.current.element = $();
		}

	},

	utils : {

		parseColor : function(str) {
			return str == 'transparent'? '' : str;
		},

		parseBackgroundImage : function(str) {
			return str.substr(0,3) == 'url'? this.parseSourceURL(str.replace('url(','').replace(')','')) : '';
		},

		parseSourceURL : function(str) {
			if(str && str.indexOf('://') == -1) {
				str = window.location.protocol + '//' + window.location.host + (window.location.port? ':' + window.location.port : '' ) + (str.charAt(0) == '/'? '' : '/') + str;
			}

			return str;
		}

	}

};

wi.elements.init();