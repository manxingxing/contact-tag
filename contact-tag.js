(function($) {
  $.widget('ui.contact_tag', {
    options:{
      afterContactAdded: null,
      afterContactRemoved: null,
      autocomplete: {source: null},
      validContactRegex: /^1\d{10}$/
    },
    _create: function() {
      var self = this;
      self.element.hide().attr('disabled', true).addClass('contact-tag-hidden-field');
      // 在Rails里，name形如'tags[]'的表单元素会合并成一个数组
      self.inputName = (this.element.attr('name') || 'tags') + '[]';
      self.tagInput = $('<input type="text" spellcheck="false" autocomplete="false" autofocus="autofocus" class="inputer"/>');
      self.newContactContainer = $('<li/>').addClass('new-contact').append(self.tagInput);
      self.contactsContainer = $("<ul/>").addClass('contacts').append(self.newContactContainer).insertAfter(self.element);

      // 如果已经有值则为它们创建tag
      var values = this.element.val().split(',');
      for (var i = 0; i < values.length; i++) {
        if ($.trim(values[i]) == '') continue;
        self.addContact(values[i]);
      }
      // 为输入框绑定事件
      self.tagInput
          .keydown(function(event) {// copied from jquery-tagit
            // Backspace is not detected within a keypress, so it must use keydown.
            var val = $.trim(self.tagInput.val());
            // 当输入框已经为空时，删除键删除前面的tag
            if (val === '' && event.which == $.ui.keyCode.BACKSPACE) {self.removeLastContact(); return; }

            // Comma/Space/Enter are all valid delimiters for new tags,
            // except when there is an open quote or if setting allowSpaces = true.
            if ((event.which === $.ui.keyCode.COMMA && event.shiftKey === false) ||
                event.which === $.ui.keyCode.ENTER ||
                (event.which == $.ui.keyCode.TAB && self.tagInput.val() !== '') ||
                event.which == $.ui.keyCode.SPACE ) {

              event.preventDefault();

              // 当有候选时，选择当前选中项，没有候选时，则将其变成tag
              if (self.tagInput.data('autocomplete-open')) {
                $('.ui-autocomplete .ui-state-focus').click();
              } else if(val !== ''){
                self.addContact(val);
              }
              self.tagInput.val('');
            }
          })
          .on('input propertychange', function(){
            var text = $.trim(self.tagInput.val());
            if (text === ''){return;}
            var separator = /[,，;；\s]/;
            if (text.match(separator)){
              var people = text.split(separator);
              for (var i = 0; i < people.length; i++) {
                var person = $.trim(people[i]);
                if (person === '') continue;
                if (self.options.autocomplete.source) {
                  var searchResult = self._searchInSource(person);
                  if (searchResult) {
                    self.addContact(searchResult.value, searchResult.label);
                  } else {
                    self.addContact(person);
                  }
                } else {
                  self.addContact(person);
                }
              }
              self.tagInput.val('');
            }
          })
          .on('blur', function(){
            if (!self.tagInput.data('autocomplete-open')) {
              var text = $.trim(self.tagInput.val());
              if (text === ''){return;}
              if (self.options.autocomplete.source) {
                var searchResult = self._searchInSource(text);
                if (searchResult) {
                  self.addContact(searchResult.value, searchResult.label);
                } else {
                  self.addContact(text);
                }
              } else {
                self.addContact(text);
              }
              self.tagInput.val('');
            }
          });

      self.contactsContainer
          .click(function(e){
            var target = e.target;
            if (this == target)
              self.tagInput.focus(); 
          })
          .on('click', '.contact span.close',function(){
            var isValid = $(this).parent().hasClass('valid');
            $(this).parent().remove();
            if (isValid && self.options.afterContactRemoved) {
              var value = $(this).parent(".contact.valid").find('input:hidden').val();
              var label = $(this).parent(".contact.valid").find('span.contact-label').text();
              if (value){
                self.options.afterContactRemoved.call(self, value, label);
              }
            }
          });
      // 自动提示
      if (self.options.autocomplete.source) {
        self.tagInput.autocomplete({
          autoFocus: true,
          source: function(search, showChoices) {
            var text = search.term.toLowerCase();
            showChoices($.grep(self.options.autocomplete.source, function(choice, i){
              return choice.value.indexOf(text) !== -1 || choice.label.indexOf(text) !== -1
            }))
          },
          focus: function(event,ui){return false; },
          select: function(event, ui){
            self.addContact(ui.item.value, ui.item.label);
            self.tagInput.val('');
            return false;
          }
        }).data("ui-autocomplete")._renderItem = function( ul, item ) {
          return $("<li>").append("<a>" + item.label + "<br/><span class='num'>" + item.value + "</span></a>").appendTo(ul);
        };
        // 当自动提示打开或关闭时，设立一个flag
        self.tagInput.bind('autocompleteopen.tagit', function(event, ui) {
            self.tagInput.data('autocomplete-open', true);
        }).bind('autocompleteclose.tagit', function(event, ui) {
            self.tagInput.data('autocomplete-open', false)
        });
      }
    },
    addContact: function(contactValue, contactLabel){
      var self = this;
      contactValue = $.trim(contactValue);
      if (contactValue == '') return;
      contactLabel = contactLabel || contactValue;
      var title = contactLabel + '(' + contactValue + ')';
      var label = $('<span class="contact-label"></span>').text(contactLabel);
      var closeButton = $('<span class="close">×</span>');
      var contact = $('<li class="contact"/>').append(label, closeButton);
      self.newContactContainer.before(contact);
      if (contactValue.match(self.options.validContactRegex)){
        var inputField = $("<input type='hidden'/>").attr({'name': self.inputName}).val(contactValue);
        contact.addClass('valid').prop('title', title).append(inputField);
        if (self.options.afterContactAdded){ self.options.afterContactAdded.call(self, contactValue, contactLabel); }
      } else {
        contact.addClass('invalid').prop('title', '不合法的值: ' + contactValue);
      }
    },
    _lastContact: function() {
      return this.contactsContainer.find('.contact:last');
    },
    removeLastContact: function(){
      var elementToBeRemoved = this._lastContact();
      elementToBeRemoved.remove();
      if (elementToBeRemoved.hasClass("valid") && this.options.afterContactRemoved){
        var label = elementToBeRemoved.find('span.contact-label').text();
        var value  = elementToBeRemoved.find('input:hidden').val();
        this.options.afterContactRemoved.call(this, value, label);
      }
    },
    removeContactByValue: function(value){
      var elementToBeRemoved = this.contactsContainer.find('.contact.valid').has('input:hidden[value=' + value + ']');
      if (elementToBeRemoved){
        elementToBeRemoved.remove();

        if (this.options.afterContactRemoved){
          var label = elementToBeRemoved.find('span.contact-label').text();
          this.options.afterContactRemoved.call(this, value, label);
        }
      }
    },
    contacts: function(){
      return this.contactsContainer.find(".contact.valid").map(function(c){
        return {
          label: $(this).find('span.contact-label').text(),
          value: $(this).find('input:hidden').val() 
        }
      })
    },
    setContacts: function(contacts){
      var self = this;
      $.each(contacts, function(i, c){
        var label = $.trim(c.label || c);
        var value = $.trim(c.value || c);

        if (value !== '') {
          self.addContact(value, label);
        }
      })
    },
    _searchInSource: function(term){
      term = term.toLowerCase();
      var results = $.grep(this.options.autocomplete.source, function(choice, i){
        return choice.value === term || choice.label === term
      });
      return results[0];
    }
  });
})(jQuery);
