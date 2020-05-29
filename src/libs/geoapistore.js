import style from "./style.js";
import { format } from "@mapbox/mapbox-gl-style-spec";
import ReconnectingWebSocket from "reconnecting-websocket";
import axios from "axios";

export class ApiStyleStore {
	constructor(opts) {
		this.onLocalStyleChange = opts.onLocalStyleChange || (() => { });
		this.localUrl = opts.apiUrl;
		this.activeLayerId = opts.layerId;
		this.websocketUrl = `ws://localhost:8000/ws`;
		this.init = this.init.bind(this);
		axios.defaults.headers.common = { Authorization: `Bearer ${opts.token}` };
		console.log(this.activeLayerId, opts.token);
	}

	init(cb) {
		axios
			.get(this.localUrl + this.activeLayerId)
			.then(response => {
				const { data } = response;
				console.log(data);
				const styleId = data;
				this.latestStyleId = styleId;
				this.notifyLocalChanges();
				cb(null);
			})
			.catch(e => {
				cb(new Error("Can not connect to style API"));
			});
	}

	notifyLocalChanges() {
		/* 		const connection = new ReconnectingWebSocket(this.websocketUrl);
		connection.onmessage = e => {
			if (!e.data) return;
			console.log("Received style update from API");
			let parsedStyle = style.emptyStyle;
			try {
				parsedStyle = JSON.parse(e.data);
			} catch (err) {
				console.error(err);
			}
			const updatedStyle = style.ensureStyleValidity(parsedStyle);
			this.onLocalStyleChange(updatedStyle);
		}; */
	}

	latestStyle(cb) {
		if (this.latestStyleId) {
			axios.get(this.localUrl + this.activeLayerId).then(response => {
				const { data: { data } } = response;
				cb(style.ensureStyleValidity(data));
			});
		} else {
			throw new Error("No latest style available. You need to init the api backend first.");
		}
	}
	onSave = () => {
		console.log(this.updatedStyle);
		axios
			.put(this.localUrl + this.activeLayerId, { style: this.updatedStyle })
			.then(response => {
				const { data: { data: { done } } } = response;
				console.log("save done?", done);
			})
			.catch(e => {
				console.log("Save failed because:", e);
			});
	};

	// Save current style replacing previous version
	save(mapStyle) {
		this.updatedStyle = mapStyle;
		return mapStyle;
	}
}
