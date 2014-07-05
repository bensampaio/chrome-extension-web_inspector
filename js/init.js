var wi = {
	
	current : {
		active : false,
		dataBox : $()
	},

	css : {
		ACTIVE : 'chrome-extension-wi-active',
		ELEMENT : 'chrome-extension-wi-element',
		CONTENT_BOX_CLASS : 'chrome-extension-wi-content_box',
		DATA_BOX_CLASS : 'chrome-extension-wi-data_box',
		DATA_FIELD : 'chrome-extension-wi-data_field'
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
		]
	},

	init : function() {
		var selector = this.elements.REFERENCE.join(',') + ',' + this.elements.TEXT.join(',') + ',' + this.elements.MULTIMEDIA.join(',');
		var containers = this.elements.CONTENT.join(',');

		// Remove Data Box when user clicks outside
		$(document).on('click', function(event) {
			if(wi.current.active) {
				wi.removeDataBox();
			}
		});

		// Set Elements click event
		$(selector)
			.filter(':not(:has(' + containers + '))')
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
	},

	addDataBox : function(domToInspect) {
		var contentBox = $('<div class="' + this.css.CONTENT_BOX_CLASS + '"></div>');
		var dataBox = $('<div class="' + this.css.DATA_BOX_CLASS + '"></div>');

		var tagName = domToInspect[0].tagName;
		var position = domToInspect.offset();
		var metadata = [];

		// Set Content Box Styles
		contentBox.css({
			width : (domToInspect.outerWidth() + 20) + 'px',
			top: position.top - 10,
			left: position.left - 10
		});

		// Set Data Box Styles
		dataBox.css({
			marginTop : domToInspect.outerHeight() + 'px'
		});

		// Set Data Box Content
		if(this.elements.MULTIMEDIA.indexOf(tagName) != -1) {
			metadata = this.getMultimediaMetadata(domToInspect);
		}
		else if(this.elements.REFERENCE.indexOf(tagName) != -1) {
			metadata = this.getReferenceMetadata(domToInspect);
		}
		else if(this.elements.TEXT.indexOf(tagName) != -1) {
			metadata = this.getTextMetadata(domToInspect);
		}

		var htmlMetadata = '<form>';
		for(var i = 0; i < metadata.length; i++) {
			var field = metadata[i];
			if(field.value) {
				htmlMetadata+= 
					'<div class="' + this.css.DATA_FIELD + '">' +
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

		// Add Content Box to Document
		$('body').append(contentBox);

		this.current.dataBox = contentBox;
	},

	getMultimediaMetadata : function(domToInspect) {
		var source = this.utils.calculateSourceURL(domToInspect[0].getAttribute('src') || domToInspect.children('source')[0].getAttribute('src'));

		return [
			{ id : 'width', label : chrome.i18n.getMessage("fieldWidthLabel"), value : domToInspect.width() + 'px' },
			{ id : 'height', label : chrome.i18n.getMessage("fieldHeightLabel"), value : domToInspect.height() + 'px' },
			{ id : 'src', label : chrome.i18n.getMessage("fieldSourceLabel"), value : source },
			{ id : 'desc', label : chrome.i18n.getMessage("fieldDescLabel"), value : domToInspect.attr('alt') }
		]
	},

	getReferenceMetadata : function(domToInspect) {
		var source = this.utils.calculateSourceURL(domToInspect[0].getAttribute('href') || domToInspect[0].getAttribute('src'));

		return this.getTextMetadata(domToInspect).concat([
			{ id : 'src', label : chrome.i18n.getMessage("fieldSourceLabel"), value : source },
			{ id : 'lang', label : chrome.i18n.getMessage("fieldLangLabel"), value : domToInspect.attr('hreflang') }
		])
	},

	getTextMetadata : function(domToInspect) {
		var backgroundURL = this.utils.calculateSourceURL(domToInspect.css('background-image').replace('url(','').replace(')',''));

		return [
			{ id : 'font', label : chrome.i18n.getMessage("fieldFontLabel"), value : domToInspect.css('font-family') },
			{ id : 'fsize', label : chrome.i18n.getMessage("fieldFSizeLabel"), value : domToInspect.css('font-size') },
			{ id : 'text-color', label : chrome.i18n.getMessage("fieldTextColorLabel"), value : domToInspect.css('color') },
			{ id : 'image-src', label : chrome.i18n.getMessage("fieldBackgroundImageLabel"), value : backgroundURL }
		]
	},

	removeDataBox : function() {
		this.current.dataBox.remove();
	},

	toggleStatus : function() {
		this.current.active = !this.current.active;

		if(this.current.active) {
			$('body').addClass(this.css.ACTIVE);
		}
		else {
			$('body').removeClass(this.css.ACTIVE);
			this.removeDataBox();
		}
	},

	utils : {
		calculateSourceURL : function(url) {
			if(url && url.indexOf('://') == -1) {
				url = window.location.protocol + '//' + window.location.host + (window.location.port? ':' + window.location.port : '' ) + '/' + url;
			}

			return url;
		}
	}

};

wi.init();