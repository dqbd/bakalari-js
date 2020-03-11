"use strict"
const fetch = require("node-fetch")
const parser = require("xml2js").parseString
const qs = require("querystring")
const crypto = require("crypto")

const Storage = require("./lib/storage")

module.exports = {}
module.exports.cache = new Storage()
module.exports.proxy = null

class DataSource {
	constructor(url) {
		this.url = url
	}

	get(params) {
		let url = this.url + "?" + qs.stringify(params)

		if (module.exports.proxy !== null && module.exports.proxy.indexOf("{url}") >= 0) {
			url = module.exports.proxy.replace("{url}", encodeURIComponent(url))
		} 

		return fetch(url)
			.then(data => data.text())
			.then(xml => new Promise((resolve, reject) => {
				parser(xml, (err, res) => err ? reject(err) : resolve(res))
			}))
	}
}

class User extends DataSource {
	constructor(url, user, pass) {
		super(url)
		this.user = user
		this.pass = pass
		this.tokenBase = null
	}

	obtain() {
		return module.exports.cache.get("users", [this.url, this.user]).catch((err) => {
			if (this.tokenBase === null) {
				throw new Error("not valid")
			}
			return this.tokenBase
		}).then(token => {
			this.tokenBase = token
			return this
		}).catch(err => {
			if (this.pass !== null && this.pass !== undefined) {
				return this.login(this.pass)
			}

			return Promise.reject(err)
		})
	}

	getHash() {
		if (this.tokenBase !== null) {
			return Promise.resolve(this.sha512(this.tokenBase + this.getDate(), true))
		} else {
			return Promise.reject(null)
		}
	}

	getDate() {
		let today = new Date();
	    let day = today.getDate(), month = today.getMonth()+1, year = today.getFullYear();

	    day = ((day<10) ? "0" : "") + day;
	    month = ((month<10) ? "0" : "") + month;

	    return year + month + day;
	}


	sha512(input, safe) {
		let sha = crypto.createHash("sha512")
		sha.update(input.replace(/\r?\n|\r/g, ""), "utf-8")

		let hash = sha.digest("base64")
		return (safe === true) ? hash.replace(/[\\|/]/g, '_').replace('+', '-') : hash
	}

	login(pass) {
		return this.get({gethx: this.user})
			.then(res => {
				let salt = res.results["salt"]
				let ikod = res.results["ikod"]
				let typ = res.results["typ"]

				let tokenBase = ["*login*", this.user, "*pwd*", this.sha512(salt + ikod + typ + pass), "*sgn*", "ANDR"].join("")

				return module.exports.cache.set("users", [this.url, this.user], tokenBase)
			}).then(token => {
				this.tokenBase = token
				this.pass = null
				return this.sha512(token + this.getDate(), true)
			}).then(hx => {
				//TODO: validate login
				return this
			})
	}

	getPage(method, data) {
		return module.exports.cache.get("cache", [method, data])
			.then(data => JSON.parse(data))
			.catch((err) => {
				return this.getHash().then(hash => {
					let payload = {hx: hash, pm: method}

					if (data !== undefined && data !== null) {
						payload["pmd"] = data
					}

					return this.get(payload).then(content => {
						return module.exports.cache.set("cache", [method, data], JSON.stringify(content)).then(() => content)
					})
				})
			})
			.then(res => {
				if (res.results === undefined) {
					throw new Error("no results")
				}
				return res.results
			})
	}
}

module.exports.User = User
module.exports.Page = require("./lib/page")
module.exports.FileStorage = require("./lib/filestorage")

module.exports.Pages = {
	LOGIN: "login",
	HOME: "home",
	MARKS: "znamky",
	SCHEDULE: "rozvrh",
	SCHEDULE_NEXT: "rozvrhnext",
	SCHEDULE_CURRENT: "rozvrhakt",
	SCHEDULE_PERMANENT: "rozvrhperm",
	HOMEWORKS: "ukoly",
	ACTIONPLAN: "akce",
	SUBSTITUTION: "suplovani",
	SUBJECTS: "predmety",
	EDUCATION: "vyuka",
	ABSENCES: "absence",
	BIANNUAL: "pololetni",
	PREDICTER: "predvidac",
	TIMELINE: "timeline",
	COMMENTS_SENT: "odeslane",
	COMMENTS_RECEIVED: "prijate",
	COMMENTS_TABLE: "nastenka",
	COMMENTS_READ: "setread",
	COMMENTS_CONFIRM: "setok",
	COMMENTS_SEND: "komsend",
	COMMENTS_RECIPIENTS: "komenslisty",
	COMMENTS_DELETE: "komdel",
	COMMENTS_SENT_V2: "odeslaneV2",
	COMMENTS_RECEIVED_V2: "prijateV2",
	COMMENTS_TABLE_V2: "nastenkaV2",
	COMMENTS_READ_V2: "setreadV2",
	COMMENTS_CONFIRM_V2: "setokV2",
	COMMENTS_SEND_V2: "komsendV2",
	COMMENTS_RECIPIENTS_V2: "komenslistyV2",
	COMMENTS_DELETE_V2: "komdelV2",
	ATTACHMENT: "priloha",
	ALL: "all",
	TEACHER_SCHEDULE: "ucitelrozvrh",
	TEACHER_SCHEDULE_NEXT: "ucitelrozvrhnext",
	TEACHER_SCHEDULE_CURRENT: "ucitelrozvrhakt",
	TEACHER_SCHEDULE_PERMANENT: "ucitelrozvrhperm",
	TEACHER_SUBJECTS: "ucitelpredmety",
	TEACHER_ACTIONPLAN: "ucitelakce",
	TEACHER_SUBSTITUTION: "ucitelsuplovani",
	TEACHER_ALL: "ucitelall",
	TEACHER_CLASSIFICATION: "classification",
	TEACHER_CLASSIFICATION_MARKS: "classificationMarks",
	TEACHER_TIMETABLE_DAY: "tkday",
	TEACHER_TIMETABLE_EDIT: "tkedit",
	TEACHER_TIMETABLE_SAVE_SUMMARY: "tksave",
	TEACHER_TIMETABLE_SAVE_ABSENCE: "tksaveabsent",
	MANAGEMENT_INTERFACES: "interfaces"
}