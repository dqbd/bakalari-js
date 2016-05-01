"use strict"
const Page = require("../page")

class Marks extends Page {
	constructor(user) {
		super("znamky", user)
	}

	get(data) {
		return super.get(data).then(res => res.predmety[0].predmet)
	}
}