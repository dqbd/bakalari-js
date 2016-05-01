"use strict"
const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")
const crypto = require("crypto")

const Storage = require("./storage")

class FileStorage extends Storage {

	constructor(folder) {
		super()
		this.folder = folder
	}

	get(table, key) {
		let target = path.join(this.folder, table, this._hash(key) + ".txt")

		return this._validatePath(target).then(path => {
			return new Promise((resolve, reject) => {
				fs.readFile(path, "utf-8", (err, res) => (err) ? reject(null) : resolve(res))
			})
		})
	}

	set(table, key, content) {
		let target = path.join(this.folder, table, this._hash(key) + ".txt")

		return this._validatePath(target)
		.catch(() => target)
		.then(path => {
			return new Promise((resolve, reject) => {
				fs.writeFile(path, content, "utf-8", (err, res) => resolve(content))
			})
		})
	}

	_validatePath(target) {
		return new Promise((resolve, reject) => {
			mkdirp(path.dirname(target), (err) => (err) ? reject(err) : resolve(target))
		})
	}

	_hash(params) {
		let md5 = crypto.createHash("md5")
		md5.update(JSON.stringify(params))
		return md5.digest("hex")
	}
}

module.exports = FileStorage