"use strict"

class Page {
	constructor(method, user) {
		this.user = user
		this.method = method
	}

	get(data) {
		return this.user.getPage(this.method, data)
	}
}

module.exports = Page