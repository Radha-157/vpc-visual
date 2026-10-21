/* ------------------------------------------------------------------
   VPC Visual – Radha's gated housing society
   Builds the SVG with small helper functions, then reveals it step by step.
   No dependencies, no build step.

   Layers (drawn in this order, so wires never cross boxes or text):
     1. wires    – dashed, flowing lines
     2. boxes    – boxes, labels, tags
     3. packets  – moving emoji (SVG <animateMotion> along the wires)
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  /* =================================================================
     TEXT CONTENT – edit these to change what the page says
     ================================================================= */

  const STEPS = [
    {
      title: 'The fenced plot',
      sub: 'VPC',
      caption: {
        title: 'Step 1 · Radha gets a fenced plot',
        plain: "Radha owns a shop and wants her own private plot of land inside a huge city. She puts a fence around it so only the people she allows can come in. Everything she builds later goes inside this fence.",
        tech: 'VPC (Virtual Private Cloud) inside an AWS Region. Its address range, 10.0.0.0/16, gives it about 65,000 private addresses.',
        watch: 'The big blue box is the AWS city (the Region). The teal box inside it is Radha’s fenced plot.'
      }
    },
    {
      title: 'Two buildings',
      sub: 'Availability Zones',
      caption: {
        title: 'Step 2 · Two separate buildings',
        plain: 'On her plot Radha builds two buildings far enough apart that a power cut or fire in one does not touch the other. If one building has trouble, the shop keeps running from the second one.',
        tech: 'Availability Zones (AZs): separate data-centre locations inside one Region, each with its own power, cooling and network.',
        watch: 'Two blue boxes appear side by side: Zone A on the left, Zone B on the right.'
      }
    },
    {
      title: 'Lobby and flats',
      sub: 'Public & private subnets',
      caption: {
        title: 'Step 3 · A lobby and flats in each building',
        plain: 'Each building has a lobby, where visitors are welcome, and private flats at the back, where only residents may go. Shop counters sit in the lobby. The valuable things, like records and money, stay in the flats.',
        tech: 'Subnets. A public subnet has a route to the internet; a private subnet does not. Each subnet lives in exactly one Availability Zone.',
        watch: 'Gold = public lobby. Purple = private flats. Each building has one of each.'
      }
    },
    {
      title: 'The main gate',
      sub: 'Internet Gateway',
      caption: {
        title: 'Step 4 · The main gate opens to the street',
        plain: 'Radha builds one main gate in the fence. Customers outside can now reach the lobby through it. A signboard (the route table) tells everyone: "anything going outside, use the main gate".',
        tech: 'Internet Gateway (IGW) plus a route table entry sending 0.0.0.0/0 (all internet traffic) to the gateway.',
        watch: 'A visitor’s envelope travels from "Visitors" along the road and arrives at the main gate.'
      }
    },
    {
      title: 'The receptionist',
      sub: 'Load Balancer + web servers',
      caption: {
        title: 'Step 5 · A receptionist shares the visitors',
        plain: 'Inside the gate a receptionist greets every visitor and sends them to a free shop counter. Each building has a counter, so no counter gets overloaded, and if one building is closed the receptionist uses the other.',
        tech: 'Application Load Balancer spreading requests across web servers (EC2 instances) in two Availability Zones.',
        watch: 'Envelopes leave the receptionist bar and go down to the web server in Zone A, then Zone B, taking turns.'
      }
    },
    {
      title: 'Back office and vault',
      sub: 'App servers + database',
      caption: {
        title: 'Step 6 · A back office and a vault behind the lobby',
        plain: 'The shop counter passes orders to a back office, and the back office writes them in a ledger kept in the vault. Everything sits in the private flats, away from the street. A second, live copy of the ledger sits in the other building, so nothing is lost.',
        tech: 'App servers and a database in private subnets. A standby replica in the second AZ is kept up to date by replication (the idea behind Multi-AZ databases).',
        watch: 'Floppy disks (data) move web → app → database. The repeat arrows show the ledger being copied between the buildings.'
      }
    },
    {
      title: 'The delivery counter',
      sub: 'NAT Gateway',
      caption: {
        title: 'Step 7 · A delivery counter for the flats',
        plain: 'People in the private flats sometimes need to order something from outside, like a software update. They hand the request to a delivery counter in the lobby, which collects it and brings it back. Outsiders cannot use the counter to walk in.',
        tech: 'NAT Gateway in a public subnet. Private servers can start connections to the internet, but the internet cannot start connections to them.',
        watch: 'A package leaves the back office, passes the delivery counter, and goes out through the main gate.'
      }
    },
    {
      title: 'Guards everywhere',
      sub: 'Security Group & NACL',
      caption: {
        title: 'Step 8 · Guards at every door and gate',
        plain: 'Each server has its own door guard who checks the visitor list. Each lobby and flat area also has a gate guard who checks everyone entering or leaving the area. Two layers of checking: an intruder has to get past both.',
        tech: 'Security Groups protect each server (they remember allowed connections). Network ACLs protect each subnet (they check every packet against numbered rules).',
        watch: 'The intruder heads for the private flats and is stopped at the boundary with a red cross: "Blocked!"'
      }
    },
    {
      title: 'Tunnel and private road',
      sub: 'VPN & VPC peering',
      caption: {
        title: 'Step 9 · A secret tunnel and a private road',
        plain: 'Radha’s home office gets a secret tunnel straight into the private flats, hidden from the street. A neighbour’s plot gets a private road to Radha’s plot so they can trade without using the public street.',
        tech: 'Site-to-Site VPN (VPN Gateway) connects an office network to the VPC over an encrypted tunnel. VPC peering links two VPCs privately.',
        watch: 'A lock moves from the office through the tunnel. A handshake moves back and forth along the private road to the Partner VPC.'
      }
    }
  ];

  const LEGEND = [
    ['✉️', 'Envelope', 'a visitor’s request'],
    ['💾', 'Floppy disk', 'data being saved'],
    ['🔁', 'Repeat arrows', 'database copying itself'],
    ['📦', 'Package', 'a software update'],
    ['😈', 'Devil', 'an intruder'],
    ['🔒', 'Lock', 'office VPN traffic'],
    ['🤝', 'Handshake', 'partner peering']
  ];

  /* =================================================================
     SVG helpers
     ================================================================= */

  const svg = document.getElementById('diagram');
  if (!svg) return;

  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  // box(parent, x, y, w, h, colourKey, extraClass, cornerRadius)
  function box(p, x, y, w, h, key, extra, rx) {
    return svgEl('rect', {
      x: x, y: y, width: w, height: h, rx: rx == null ? 12 : rx,
      'class': 'box k-' + key + (extra ? ' ' + extra : '')
    }, p);
  }

  // txt(parent, x, y, string, cssClass, size, weight, anchor)
  function txt(p, x, y, s, cls, size, weight, anchor) {
    const t = svgEl('text', {
      x: x, y: y, 'class': cls, 'font-size': size || 12,
      'font-weight': weight || 500, 'text-anchor': anchor || 'start'
    }, p);
    t.textContent = s;
    return t;
  }

  // a server: small solid box with a title and a one-word analogy
  function server(p, x, y, w, title, sub, key) {
    box(p, x, y, w, 42, key, 'solid', 9);
    txt(p, x + w / 2, y + 18, title, 't', 13, 700, 'middle');
    txt(p, x + w / 2, y + 33, sub, 'sub', 10.5, 500, 'middle');
  }

  // a small pill tag, e.g. "SG guard"
  function tag(p, x, y, w, s, key) {
    box(p, x, y, w, 17, key, 'solid', 8.5);
    txt(p, x + w / 2, y + 12, s, 'tx-' + key, 10, 700, 'middle');
  }

  // a dashed, flowing wire that packets can travel along
  function wire(p, id, d, colourClass) {
    return svgEl('path', { id: id, d: d, 'class': 'wire ' + colourClass }, p);
  }

  // A moving emoji. It follows the path `pathId`.
  //   o.dur    seconds for one loop
  //   o.begin  delay before the first loop (seconds)
  //   o.from / o.to   fraction of the loop (0-1) during which it is visible
  //                   and moving; outside it the packet is hidden, so several
  //                   packets can take turns along one chain of wires.
  //   o.bounce  go to the end of the path and back again, always visible
  function packet(p, emoji, pathId, o) {
    o = o || {};
    const dur = o.dur || 4;
    const t = svgEl('text', {
      'class': 'pk', 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': o.size || 18, 'font-family': EMOJI_FONT,
      opacity: o.bounce ? 1 : 0
    }, p);
    t.textContent = emoji;

    let keyPoints, keyTimes;
    if (o.bounce) {
      keyPoints = '0;1;0';
      keyTimes = '0;0.5;1';
    } else {
      const a = Math.max(o.from == null ? 0.02 : o.from, 0.03);
      const b = Math.min(o.to == null ? 0.98 : o.to, 0.97);
      keyPoints = '0;0;1;1';
      keyTimes = '0;' + a.toFixed(3) + ';' + b.toFixed(3) + ';1';

      const e = 0.015;
      svgEl('animate', {
        attributeName: 'opacity',
        values: '0;0;1;1;0;0',
        keyTimes: ['0', a.toFixed(3), (a + e).toFixed(3), (b - e).toFixed(3), b.toFixed(3), '1'].join(';'),
        dur: dur + 's', begin: (o.begin || 0) + 's', repeatCount: 'indefinite'
      }, t);
    }

    const m = svgEl('animateMotion', {
      dur: dur + 's', begin: (o.begin || 0) + 's', repeatCount: 'indefinite',
      calcMode: 'linear', rotate: '0', keyPoints: keyPoints, keyTimes: keyTimes
    }, t);
    const mp = document.createElementNS(NS, 'mpath');
    mp.setAttribute('href', '#' + pathId);
    mp.setAttributeNS(XLINK, 'xlink:href', '#' + pathId);
    m.appendChild(mp);
    return t;
  }

  /* =================================================================
     Stage: background + layers
     ================================================================= */

  const defs = svgEl('defs', null, svg);
  const grad = svgEl('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  svgEl('stop', { offset: '0%', 'stop-color': '#0a1030' }, grad);
  svgEl('stop', { offset: '100%', 'stop-color': '#131c4d' }, grad);
  const dots = svgEl('pattern', { id: 'dots', width: 24, height: 24, patternUnits: 'userSpaceOnUse' }, defs);
  svgEl('circle', { cx: 2, cy: 2, r: 0.9, fill: '#6d82d6', 'fill-opacity': 0.35 }, dots);

  svgEl('rect', { x: 0, y: 0, width: 1100, height: 620, fill: 'url(#sky)' }, svg);
  svgEl('rect', { x: 0, y: 0, width: 1100, height: 620, fill: 'url(#dots)' }, svg);

  // Invisible path used only by a packet (it shares a wire that is already drawn)
  svgEl('path', { id: 'w-net', d: 'M475,84 L139,84', fill: 'none' }, defs);

  const layers = {
    wires: svgEl('g', { id: 'layer-wires' }, svg),
    boxes: svgEl('g', { id: 'layer-boxes' }, svg),
    packets: svgEl('g', { id: 'layer-packets' }, svg)
  };

  const pieces = [];
  // P('boxes', 3) -> a group that is shown from step 3 onward
  function P(layer, step) {
    const g = svgEl('g', { 'class': 'piece' }, layers[layer]);
    pieces.push({ g: g, step: step });
    return g;
  }

  /* =================================================================
     The scene (all coordinates are in the 1100 x 620 viewBox)
     ================================================================= */

  // ---- Step 1: AWS Cloud region + VPC -------------------------------
  (function () {
    const g = P('boxes', 1);
    box(g, 145, 6, 800, 608, 'blue', 'region', 16);
    txt(g, 160, 27, 'AWS Cloud · the city', 'tx-blue', 13, 700);
    box(g, 158, 30, 774, 560, 'teal', '', 14);
    txt(g, 172, 52, 'VPC  10.0.0.0/16', 'tx-teal', 14, 700);
    txt(g, 172, 67, 'Radha’s fenced plot', 'sub', 11, 500);
  })();

  // ---- Step 2: two Availability Zones --------------------------------
  (function () {
    const g = P('boxes', 2);
    box(g, 180, 170, 352, 390, 'blue');
    box(g, 558, 170, 352, 390, 'blue');
    txt(g, 520, 190, 'Availability Zone A', 'tx-blue', 12.5, 700, 'end');
    txt(g, 898, 190, 'Availability Zone B', 'tx-blue', 12.5, 700, 'end');
    const ia = txt(g, 196, 191, '🏢', 't', 15, 400);
    const ib = txt(g, 574, 191, '🏢', 't', 15, 400);
    ia.setAttribute('font-family', EMOJI_FONT);
    ib.setAttribute('font-family', EMOJI_FONT);
  })();

  // ---- Step 3: subnets -----------------------------------------------
  (function () {
    const g = P('boxes', 3);
    // public (gold): labels on the right, so wires from the load balancer pass clear
    box(g, 192, 206, 328, 136, 'gold');
    box(g, 570, 206, 328, 136, 'gold');
    txt(g, 508, 224, 'Public lobby', 'tx-gold', 12.5, 700, 'end');
    txt(g, 886, 224, 'Public lobby', 'tx-gold', 12.5, 700, 'end');
    // private (purple): labels on the left
    box(g, 192, 358, 328, 192, 'purple');
    box(g, 570, 358, 328, 192, 'purple');
    txt(g, 204, 376, 'Private flats', 'tx-purple', 12.5, 700);
    txt(g, 582, 376, 'Private flats', 'tx-purple', 12.5, 700);
  })();

  // ---- Step 4: gate, internet, visitors, route table, first envelope ----
  (function () {
    const w = P('wires', 4);
    wire(w, 'w-vis', 'M132,180 L139,180 L139,84 L475,84', 'wc-sky');
    wire(w, 'w-v2n', 'M72,150 L72,104', 'wc-sky');

    const g = P('boxes', 4);
    box(g, 12, 44, 120, 60, 'sky', 'solid');
    txt(g, 72, 70, 'The Internet', 't', 13, 700, 'middle');
    txt(g, 72, 86, 'outside world', 'sub', 10.5, 500, 'middle');
    box(g, 12, 150, 120, 60, 'sky', 'solid');
    txt(g, 72, 176, 'Visitors', 't', 13, 700, 'middle');
    txt(g, 72, 192, 'Radha’s customers', 'sub', 10.5, 500, 'middle');

    box(g, 475, 38, 140, 56, 'sky', 'solid');
    txt(g, 545, 58, 'Internet Gateway', 't', 13, 700, 'middle');
    txt(g, 545, 73, 'main gate', 'sub', 10.5, 500, 'middle');

    box(g, 180, 96, 206, 20, 'blue', 'solid', 6);
    txt(g, 190, 110, 'Route table: 0.0.0.0/0 → gate', 't', 11, 600);

    const k = P('packets', 4);
    packet(k, '✉️', 'w-vis', { dur: 4.5, from: 0.03, to: 0.97 });
  })();

  // ---- Step 5: load balancer + web servers ----------------------------
  (function () {
    const w = P('wires', 5);
    wire(w, 'w-igw-lb', 'M545,94 L545,122', 'wc-sky');
    wire(w, 'w-lb-a', 'M290,153 L290,236', 'wc-gold');
    wire(w, 'w-lb-b', 'M670,153 L670,236', 'wc-gold');

    const g = P('boxes', 5);
    box(g, 225, 122, 640, 28, 'blue', 'solid', 14);
    txt(g, 545, 141, 'Load Balancer · receptionist', 't', 13, 700, 'middle');
    server(g, 210, 244, 100, 'Web server', 'shop counter', 'gold');
    server(g, 590, 244, 100, 'Web server', 'shop counter', 'gold');

    const k = P('packets', 5);
    packet(k, '✉️', 'w-lb-a', { dur: 3.2, from: 0.03, to: 0.97 });
    packet(k, '✉️', 'w-lb-b', { dur: 3.2, begin: 1.6, from: 0.03, to: 0.97 });
  })();

  // ---- Step 6: app servers, database, live copy ------------------------
  (function () {
    const w = P('wires', 6);
    wire(w, 'w-wa-a', 'M306,296 L306,400', 'wc-teal');
    wire(w, 'w-aa-d', 'M318,431 L382,431', 'wc-teal');
    wire(w, 'w-wb-b', 'M680,296 L680,322 L800,322 L800,400', 'wc-teal');
    wire(w, 'w-ab-r', 'M770,431 L690,431', 'wc-teal');
    wire(w, 'w-rep', 'M490,431 L590,431', 'wc-violet');

    const g = P('boxes', 6);
    server(g, 210, 410, 100, 'App server', 'back office', 'purple');
    server(g, 390, 410, 100, 'Database', 'the vault', 'purple');
    server(g, 590, 410, 100, 'Database', 'live copy', 'purple');
    server(g, 770, 410, 100, 'App server', 'back office', 'purple');

    const k = P('packets', 6);
    packet(k, '💾', 'w-wa-a', { dur: 6, from: 0.03, to: 0.4 });
    packet(k, '💾', 'w-aa-d', { dur: 6, from: 0.42, to: 0.8 });
    packet(k, '💾', 'w-wb-b', { dur: 6, begin: 3, from: 0.03, to: 0.62 });
    packet(k, '🔁', 'w-rep', { dur: 3, bounce: true });
  })();

  // ---- Step 7: NAT gateway + software update ---------------------------
  (function () {
    const w = P('wires', 7);
    wire(w, 'w-up', 'M840,402 L840,296', 'wc-gold');
    wire(w, 'w-out', 'M884,265 L921,265 L921,84 L615,84', 'wc-gold');

    const g = P('boxes', 7);
    server(g, 770, 244, 100, 'NAT Gateway', 'delivery counter', 'gold');

    const k = P('packets', 7);
    packet(k, '📦', 'w-up', { dur: 8, from: 0.02, to: 0.22 });
    packet(k, '📦', 'w-out', { dur: 8, from: 0.24, to: 0.62 });
    packet(k, '📦', 'w-net', { dur: 8, from: 0.64, to: 0.97 });
  })();

  // ---- Step 8: security (SG guards, NACL guards, blocked intruder) -------
  (function () {
    const w = P('wires', 8);
    wire(w, 'w-bad', 'M139,120 L139,520 L186,520', 'wc-red');

    const g = P('boxes', 8);
    // Security Group tags under every server
    [[210, 290], [590, 290], [210, 456], [390, 456], [590, 456], [770, 456]].forEach(function (c) {
      tag(g, c[0], c[1], 58, 'SG guard', 'red');
    });
    // NACL tags on the subnets
    [[204, 210], [582, 210], [446, 528], [824, 528]].forEach(function (c) {
      tag(g, c[0], c[1], 66, 'NACL guard', 'red');
    });
    // red cross at the private subnet boundary + "Blocked!"
    svgEl('path', {
      d: 'M185,513 L199,527 M199,513 L185,527',
      stroke: '#ff6b6b', 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none'
    }, g);
    txt(g, 212, 525, 'Blocked!', 'tx-red', 13, 800);

    const k = P('packets', 8);
    packet(k, '😈', 'w-bad', { dur: 6, from: 0.03, to: 0.95 });
  })();

  // ---- Step 9: office VPN + partner peering -----------------------------
  (function () {
    const w = P('wires', 9);
    wire(w, 'w-off', 'M132,583 L475,583', 'wc-green');
    wire(w, 'w-tun', 'M545,568 L545,495 L512,495', 'wc-green');
    wire(w, 'w-peer', 'M955,339 L910,339', 'wc-teal');

    const g = P('boxes', 9);
    box(g, 12, 540, 120, 62, 'green', 'solid');
    txt(g, 72, 566, 'Radha’s Office', 't', 13, 700, 'middle');
    txt(g, 72, 583, 'works from home', 'sub', 10.5, 500, 'middle');
    box(g, 475, 568, 140, 30, 'green', 'solid', 15);
    txt(g, 545, 587, 'VPN Gateway', 't', 12.5, 700, 'middle');
    txt(g, 172, 607, 'VPN: Radha’s secret tunnel', 'tx-green', 11, 600);

    box(g, 955, 300, 135, 78, 'teal', 'solid');
    txt(g, 1022, 322, 'Partner VPC', 't', 13, 700, 'middle');
    txt(g, 1022, 338, '10.1.0.0/16', 'tx-teal', 11, 600, 'middle');
    txt(g, 1022, 355, 'neighbour’s plot', 'sub', 10.5, 500, 'middle');
    txt(g, 1022, 398, 'VPC peering', 'tx-teal', 11.5, 700, 'middle');
    txt(g, 1022, 412, 'private road', 'sub', 10.5, 500, 'middle');

    const k = P('packets', 9);
    packet(k, '🔒', 'w-off', { dur: 5, from: 0.03, to: 0.5 });
    packet(k, '🔒', 'w-tun', { dur: 5, from: 0.52, to: 0.97 });
    packet(k, '🤝', 'w-peer', { dur: 3, bounce: true });
  })();

  /* =================================================================
     Sidebar, legend, caption, controls
     ================================================================= */

  const stepsNav = document.getElementById('steps');
  const legendList = document.getElementById('legend');
  const btnAuto = document.getElementById('btn-auto');
  const btnReset = document.getElementById('btn-reset');
  const capTitle = document.getElementById('cap-title');
  const capPlain = document.getElementById('cap-plain');
  const capTech = document.getElementById('cap-tech');
  const capWatch = document.getElementById('cap-watch');

  const stepButtons = STEPS.map(function (s, i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'step';
    b.innerHTML = '<span class="num"></span><span class="t"></span><span class="s"></span>';
    b.querySelector('.num').textContent = String(i + 1);
    b.querySelector('.t').textContent = s.title;
    b.querySelector('.s').textContent = s.sub;
    b.addEventListener('click', function () { go(i); });
    stepsNav.appendChild(b);
    return b;
  });

  LEGEND.forEach(function (row) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="em" aria-hidden="true"></span><span><b></b> – <span class="d"></span></span>';
    li.querySelector('.em').textContent = row[0];
    li.querySelector('b').textContent = row[1];
    li.querySelector('.d').textContent = row[2];
    legendList.appendChild(li);
  });

  let current = 0;
  let glowTimer = null;

  function go(i) {
    current = Math.max(0, Math.min(STEPS.length - 1, i));
    const stepNo = current + 1;

    pieces.forEach(function (p) {
      p.g.classList.remove('new');
      p.g.classList.toggle('on', p.step <= stepNo);
    });
    // let the browser register the plain state, then glow the newest pieces
    void svg.getBoundingClientRect();
    pieces.forEach(function (p) {
      if (p.step === stepNo) p.g.classList.add('new');
    });
    clearTimeout(glowTimer);
    glowTimer = setTimeout(function () {
      pieces.forEach(function (p) { p.g.classList.remove('new'); });
    }, 2000);

    stepButtons.forEach(function (b, n) {
      b.classList.toggle('done', n < current);
      if (n === current) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });

    const c = STEPS[current].caption;
    capTitle.textContent = c.title;
    capPlain.textContent = c.plain;
    capTech.textContent = c.tech;
    capWatch.textContent = c.watch;
  }

  /* ---------- auto-play (every 5 seconds) ---------- */
  let timer = null;

  function stopAuto() {
    clearInterval(timer);
    timer = null;
    btnAuto.setAttribute('aria-pressed', 'false');
  }

  function startAuto() {
    clearInterval(timer);
    btnAuto.setAttribute('aria-pressed', 'true');
    if (current >= STEPS.length - 1) go(0);
    timer = setInterval(function () {
      if (current < STEPS.length - 1) {
        go(current + 1);
      } else {
        stopAuto();
      }
    }, 5000);
  }

  btnAuto.addEventListener('click', function () {
    if (timer) stopAuto(); else startAuto();
  });

  btnReset.addEventListener('click', function () {
    stopAuto();
    go(0);
  });

  /* ---------- reduced motion: freeze the moving packets ---------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotionPreference() {
    if (typeof svg.pauseAnimations !== 'function') return;
    if (reduce.matches) svg.pauseAnimations(); else svg.unpauseAnimations();
  }
  applyMotionPreference();
  if (reduce.addEventListener) reduce.addEventListener('change', applyMotionPreference);

  go(0);
})();
