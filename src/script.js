import * as F from "https://cdn.jsdelivr.net/npm/@faker-js/faker@8.4.1/+esm";

const fakerEN = F.fakerEN;
const $ = (s) => document.querySelector(s);
const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => {
	a = [...a];
	for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1);[a[i], a[j]] = [a[j], a[i]]; }
	return a;
};
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { return; } };
const norm = (s) =>
	String(s).toLowerCase().replace(/ł/g, "l").replace(/ı/g, "i").replace(/ø/g, "o").replace(/đ/g, "d").replace(/ß/g, "ss").replace(/æ/g, "ae")
		.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zа-яё0-9]/g, "");
const icons = () => window.lucide?.createIcons();

const SUITS = ["spades", "hearts", "diamonds", "clubs"];
const RANKS = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
const CARD_URL = "https://cdn.jsdelivr.net/gh/hayeah/playing-cards-assets@master/svg-cards/";
const cardHtml = (r, s) => `<img class="cimg" src="${CARD_URL}${r}_of_${s}.svg" alt="${r} of ${s}" />`;

const PHOTO_IDS = Array.from({ length: 90 }, (_, i) => i + 10).filter((i) => i !== 86 && i !== 97);
const photoHtml = (id) => `<img class="pimg" src="https://picsum.photos/id/${id}/300/300" alt="" />`;

const INTL = ["fakerDE", "fakerFR", "fakerES", "fakerIT", "fakerPL", "fakerTR", "fakerPT_BR", "fakerNL", "fakerSV", "fakerCS_CZ"].map((k) => F[k]).filter(Boolean);
const PORTRAITS = [...Array.from({ length: 100 }, (_, i) => ["men", i]), ...Array.from({ length: 100 }, (_, i) => ["women", i])];
const portrait = (g, i) => `https://randomuser.me/api/portraits/${g}/${i}.jpg`;

function people(n, pickFaker) {
	const items = [], seen = new Set(), faces = shuffle(PORTRAITS);
	while (items.length < n) {
		const [g, i] = faces[items.length];
		const f = pickFaker();
		const a = f.person.firstName(g === "men" ? "male" : "female"), b = f.person.lastName();
		if (seen.has(norm(a))) continue;
		seen.add(norm(a));
		items.push({
			html: `<div class="person"><img src="${portrait(g, i)}" alt="" /><b>${a} ${b}</b></div>`,
			prompt: `<img class="face" src="${portrait(g, i)}" alt="" />`,
			ans: [a, b], ph: ["First name", "Last name"],
		});
	}
	return { kind: "type", items };
}

const MODES = [
	{
		id: "cards", t: "Cards", i: "spade", c: "#e5484d", max: 52, def: 10,
		gen: (n) => {
			const pool = [];
			SUITS.forEach((s) => RANKS.forEach((r) => pool.push({ html: cardHtml(r, s) })));
			return { kind: "pick", pool, items: shuffle(pool.map((_, i) => i)).slice(0, n).map((id) => ({ id, html: pool[id].html })) };
		}
	},
	{
		id: "images", t: "Images", i: "image", c: "#f08c00", max: PHOTO_IDS.length, def: 10,
		gen: (n) => {
			const chosen = shuffle(PHOTO_IDS).slice(0, n);
			const pool = shuffle(chosen).map((id) => ({ pid: id, html: photoHtml(id) }));
			return { kind: "pick", pool, items: chosen.map((id) => ({ id: pool.findIndex((p) => p.pid === id), html: photoHtml(id) })) };
		}
	},
	{ id: "names", t: "Names", i: "user", c: "#2f9e44", max: 40, def: 8, gen: (n) => people(n, () => fakerEN) },
	{ id: "intl", t: "International names", i: "globe", c: "#0c9aa6", max: 40, def: 8, gen: (n) => people(n, () => INTL[rnd(INTL.length)]) },
	{
		id: "numbers", t: "Numbers", i: "hash", c: "#3b82f6", max: 200, def: 20,
		gen: (n) => {
			const digits = Array.from({ length: n }, () => rnd(10)).join("");
			const items = [];
			for (let i = 0; i < n; i += 2) {
				const v = digits.slice(i, i + 2);
				items.push({ html: `<b>${v}</b>`, prompt: "", ans: [v], ph: [v.length === 2 ? "00" : "0"], num: v.length });
			}
			return { kind: "type", items };
		}
	},
	{
		id: "words", t: "Words", i: "type", c: "#8b5cf6", max: 100, def: 15,
		gen: (n) => {
			const set = new Set();
			while (set.size < n) { const w = fakerEN.word.noun().toLowerCase(); if (w.length >= 3 && w.length <= 10 && /^[a-z]+$/.test(w)) set.add(w); }
			return { kind: "type", items: [...set].map((w) => ({ html: `<span class="w">${w}</span>`, prompt: "", ans: [w], ph: ["word"] })) };
		}
	},
];

const DESC = {
	cards: "Memorize playing cards.",
	images: "Memorize random images.",
	names: "Memorize people's names.",
	intl: "Memorize international names.",
	numbers: "Memorize random digits shown in pairs.",
	words: "Memorize random words.",
};
const UNIT = { cards: "Cards", images: "Images", names: "Names", intl: "Names", numbers: "Digits", words: "Words" };
const saved = load("mt_times3", {});
const TIMES = { prep: saved.prep ?? 10, mem: saved.mem ?? 90, rec: saved.rec ?? 60 };
const TIME_FIELDS = [
	["prep", "Preparation time", "Rest before memorizing and before recall"],
	["mem", "Memorization time", "0 = no limit"],
	["rec", "Recall time", "0 = no limit"],
];

$("#menu").innerHTML = MODES.map((m) => `<button class="tile" style="--c:${m.c}" data-id="${m.id}"><span class="ico"><i data-lucide="${m.i}"></i></span><b>${m.t}</b><small>${DESC[m.id]}</small></button>`).join("");
$("#menu").onclick = (e) => { const b = e.target.closest(".tile"); if (b) openSetup(MODES.find((m) => m.id === b.dataset.id)); };
icons();

function showView(v) {
	["menu", "setup", "play"].forEach((id) => ($("#" + id).hidden = id !== v));
	document.querySelector("header").hidden = v !== "menu";
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function openSetup(m) {
	const count = Math.min(load("mt_count_" + m.id, m.def), m.max);
	const el = $("#setup");
	el.innerHTML = `<div class="panel setup" style="--c:${m.c}">
		<div class="hero"><span class="ico"><i data-lucide="${m.i}"></i></span><div><h2>${m.t}</h2><p>${DESC[m.id]}</p></div></div>
		<div class="srow"><div><b>${UNIT[m.id]} to memorize</b><small>Up to ${m.max}${m.id === "numbers" ? ", shown in pairs" : ""}</small></div>
			<div class="ctl"><input id="n" type="number" min="1" max="${m.max}" value="${count}" /></div></div>
		${TIME_FIELDS.map(([k, l, h]) => `<div class="srow"><div><b>${l}</b><small>${h}</small></div>
			<div class="ctl"><input data-t="${k}" type="number" min="0" value="${TIMES[k]}" /><span>seconds</span></div></div>`).join("")}
		<div class="flow" id="flow"></div>
		<div class="row-btns"><button class="btn main" id="go">Start</button><button class="btn" id="back">Back</button></div>
	</div>`;
	showView("setup");
	icons();
	const read = () => {
		const t = {};
		el.querySelectorAll("[data-t]").forEach((i) => (t[i.dataset.t] = Math.max(0, parseInt(i.value) || 0)));
		return t;
	};
	const flow = () => {
		const t = read(), f = (s) => (s ? fmt(s) : "no limit");
		$("#flow").innerHTML = [["Preparation", f(t.prep).replace("no limit", "skipped")], ["Memorization", f(t.mem)], ["Preparation", f(t.prep).replace("no limit", "skipped")], ["Recall", f(t.rec)]]
			.map(([l, v], i) => `${i ? "<i>›</i>" : ""}<span>${l} <b>${v}</b></span>`).join("");
	};
	flow();
	el.oninput = flow;
	$("#back").onclick = () => showView("menu");
	const go = () => {
		const n = Math.max(1, Math.min(m.max, parseInt($("#n").value) || m.def));
		Object.assign(TIMES, read());
		save("mt_times3", TIMES);
		save("mt_count_" + m.id, n);
		start(m, n);
	};
	$("#go").onclick = go;
	el.onkeydown = (e) => e.key === "Enter" && go();
}

let G = null;
const PHASES = [
	{ k: "prep", label: "Starts in", skip: "Start now" },
	{ k: "mem", label: "Memorization ends in", skip: "Finished" },
	{ k: "prep", label: "Recall starts in", skip: "Start now" },
	{ k: "rec", label: "Recall ends in", skip: "Finished" },
];

function preload(d) {
	const urls = new Set();
	[...d.items, ...(d.pool || [])].forEach((it) => {
		const m = /src="([^"]+)"/.exec(it.html || "");
		if (m) urls.add(m[1]);
	});
	urls.forEach((u) => { const im = new Image(); im.src = u; });
}

function start(m, n) {
	G = { m, n, data: m.gen(n), timer: null, idx: 0, stage: "" };
	preload(G.data);
	showView("play");
	phase(0);
}

function step(d) {
	const n = G.data.items.length;
	G.idx = Math.min(n - 1, Math.max(0, G.idx + d));
	drawViewer();
}

document.addEventListener("keydown", (e) => {
	if (!G || G.stage !== "mem") return;
	if (e.key === "ArrowRight") step(1);
	if (e.key === "ArrowLeft") step(-1);
});

function drawViewer() {
	const { items } = G.data, i = G.idx, id = G.m.id, n = items.length;
	const mini = (it, j, on) => `<button class="mini${on ? " on" : ""}" data-j="${j}">${it.html}</button>`;
	$("#body").innerHTML = `<div class="viewer ${id}">
		<div class="side l">${items.slice(0, i).map((it, j) => mini(it, j)).join("")}</div>
		<div class="cur">${items[i].html}</div>
		<div class="side r">${items.slice(i + 1).map((it, k) => mini(it, i + 1 + k)).join("")}</div>
		<div class="foot">
			<div class="count">${i + 1} / ${n}</div>
			<div class="nav">
				<button class="nb" data-a="first" aria-label="First"><i data-lucide="skip-back"></i></button>
				<button class="nb" data-a="-1" aria-label="Previous"><i data-lucide="chevron-left"></i></button>
				<button class="nb" data-a="1" aria-label="Next"><i data-lucide="chevron-right"></i></button>
			</div>
		</div>
		<div class="all ${id}">${items.map((it, j) => mini(it, j, j === i)).join("")}</div>
	</div>`;
	icons();
	const left = $(".side.l");
	left.scrollTop = left.scrollHeight;
	const all = $(".all"), on = all.querySelector(".on");
	if (all.offsetParent && on) all.scrollTop = on.offsetTop - all.clientHeight / 2 + on.offsetHeight / 2;
}

function phase(k) {
	clearInterval(G.timer);
	G.stage = "";
	if (k === 4) { collect(); return results(); }
	const p = PHASES[k], sec = TIMES[p.k], m = G.m;
	if (sec <= 0 && p.k === "prep") return phase(k + 1);

	$("#play").innerHTML = `<div class="panel" style="--c:${m.c}">
		<div class="bar"><b class="ttl">${m.t}</b><span class="tl">${p.label} <span class="t" id="tm">${sec ? fmt(sec) : "∞"}</span></span>
		<button class="btn main" id="skip">${p.skip}</button></div>
		<div id="body">${p.k === "prep" ? `<div class="big">${k === 0 ? "Memorization starts soon" : "Recall starts soon"}</div>` : ""}</div></div>`;
	$("#skip").onclick = () => phase(k + 1);
	const body = $("#body");
	if (p.k === "mem") {
		G.idx = 0;
		G.stage = "mem";
		drawViewer();
		body.onclick = (e) => {
			const b = e.target.closest("[data-j],[data-a]");
			if (!b) return;
			if (b.dataset.j) { G.idx = +b.dataset.j; drawViewer(); }
			else if (b.dataset.a === "first") { G.idx = 0; drawViewer(); }
			else step(+b.dataset.a);
		};
		let sx = 0, sy = 0;
		body.ontouchstart = (e) => { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; };
		body.ontouchend = (e) => {
			const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
			if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
		};
	}
	if (p.k === "rec") drawRecall();
	if (sec > 0) {
		const end = Date.now() + sec * 1000;
		G.timer = setInterval(() => {
			const left = Math.ceil((end - Date.now()) / 1000);
			if (left <= 0) return phase(k + 1);
			$("#tm").textContent = fmt(left);
		}, 250);
	}
}

function drawRecall() {
	const d = G.data, body = $("#body");
	if (d.kind === "pick") {
		if (!G.pick) G.pick = { ans: Array(d.items.length).fill(null), act: 0 };
		const { ans, act } = G.pick;
		body.innerHTML = `<div class="slots ${G.m.id}">${d.items.map((_, i) =>
			`<button class="slot ${i === act ? "act" : ""}" data-i="${i}"><small>${i + 1}</small>${ans[i] != null ? d.pool[ans[i]].html : ""}</button>`).join("")}</div>
			<div class="palette ${G.m.id}">${d.pool.map((p, j) => `<button class="pal ${ans.includes(j) ? "used" : ""}" data-j="${j}">${p.html}</button>`).join("")}</div>`;
		body.onclick = (e) => {
			const s = e.target.closest(".slot"), p = e.target.closest(".pal"), P = G.pick;
			if (s) { const i = +s.dataset.i; P.ans[i] = null; P.act = i; }
			else if (p && !P.ans.includes(+p.dataset.j)) {
				P.ans[P.act] = +p.dataset.j;
				const after = P.ans.findIndex((v, i) => v == null && i > P.act);
				const before = P.ans.findIndex((v) => v == null);
				if (after >= 0) P.act = after;
				else if (before >= 0) P.act = before;
			} else return;
			drawRecall();
		};
	} else {
		body.innerHTML = d.items.map((it, i) => `<div class="rrow"><div class="pr">${it.prompt || i + 1}</div><div class="inp">${it.ans.map((_, j) =>
			`<input data-i="${i}" data-j="${j}" placeholder="${it.ph[j]}" autocomplete="off" autocapitalize="off" ${it.num ? `inputmode="numeric" maxlength="${it.num}"` : ""} />`).join("")}</div></div>`).join("");
		body.onkeydown = (e) => {
			if (e.key !== "Enter") return;
			const all = [...body.querySelectorAll("input")];
			all[all.indexOf(e.target) + 1]?.focus();
		};
		body.querySelector("input")?.focus();
	}
}

function collect() {
	if (G.data.kind !== "type") return;
	G.typed = G.data.items.map((_, i) => [...document.querySelectorAll(`#body input[data-i="${i}"]`)].map((x) => x.value.trim()));
}

function results() {
	const { m, data: d } = G;
	let good, total = d.items.length, list;
	if (d.kind === "pick") {
		const cells = d.items.map((it, i) => {
			const a = G.pick?.ans[i], ok = a === it.id;
			const mine = a != null ? d.pool[a].html : '<span class="empty">—</span>';
			return { ok, h: `<div class="rc"><i>${i + 1}</i><div class="rp ${ok ? "ok" : "bad"}">${mine}</div>${ok ? "" : `<div class="rp ok">${it.html}</div>`}</div>` };
		});
		good = cells.filter((c) => c.ok).length;
		list = `<div class="rgrid ${m.id}">${cells.map((c) => c.h).join("")}</div>`;
	} else {
		const rows = d.items.map((it, i) => {
			const a = G.typed?.[i] || [], ok = it.ans.every((x, j) => norm(x) === norm(a[j] || ""));
			return { ok, pr: it.prompt || i + 1, v: ok ? it.ans.join(" ") : `${a.filter(Boolean).join(" ") || "—"} <small>correct: ${it.ans.join(" ")}</small>` };
		});
		good = rows.filter((r) => r.ok).length;
		list = rows.map((r) => `<div class="res ${r.ok ? "ok" : "bad"}"><div class="pr">${r.pr}</div><div class="v">${r.v}</div></div>`).join("");
	}
	$("#play").innerHTML = `<div class="panel" style="--c:${m.c}">
		<h2><span class="ico"><i data-lucide="${m.i}"></i></span>${m.t}: results</h2>
		<div class="score">${good} / ${total}</div>
		<div class="row-btns" style="margin-bottom:16px"><button class="btn main" id="again">Try again</button><button class="btn" id="menu-btn">Menu</button></div>
		${list}
	</div>`;
	icons();
	$("#again").onclick = () => start(m, G.n);
	$("#menu-btn").onclick = () => showView("menu");
}