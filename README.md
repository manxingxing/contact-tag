contact-tag
===========

生成联系人标签，就像电子邮箱的收件人一样。

模仿 [jquery-tagit](http://aehlke.github.io/tag-it/)的代码制作。

### 依赖

* jQuery
* jQuery-ui
* jQuery-ui-autocomplete
    

### 使用方法

```javascript
bla = $("#contact").contact_tag({
        validContactRegex: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/,
        autocomplete: {
          source: [
            {label: 'name1', value: 'random@gmail.com'},
            {label: 'name2', value: 'random2@gmail.com'}
          ]
        }
      });
```
