# bakalari-js

API implementace pro IS Bakaláři psána v JS. Používá se mobilní API nacházející se v Android aplikaci. 

## Instalace

`npm install bakalari`

## Použití

```
"use strict"
let Bakalari = require("bakalari")

// proxy pro použití v prohlížeči (CORS)
Bakalari.proxy = "http://cors.io/?u={url}"

// cache pro použtí v node
Bakalari.cache = new Bakalari.FileStorage(__dirname + "/temp")

new Bakalari.User("http://derp.info/login.aspx", "jmeno", "heslo")
	.obtain()
	.then(user => user.getPage(Bakalari.Pages.MARKS))
	.then(marks => console.log(marks))
	.catch(err => console.log(err))
```

