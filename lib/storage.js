"use strict"

class Storage {
	get(table, key) {
		return Promise.reject(null)
	}

	set(table, key, content) {
		return Promise.resolve(content)
	}
}

module.exports = Storage