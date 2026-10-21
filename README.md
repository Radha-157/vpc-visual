# VPC Visual: Radha's gated housing society

An animated, beginner-friendly diagram that explains an **AWS VPC** step by step, in plain language a non-IT person can follow. The whole story is told as a gated housing society owned by a shop owner named **Radha**.

No build step, no dependencies. Just open `index.html` (or host it on GitHub Pages).

| Technical term | Plain-language picture |
| --- | --- |
| VPC | A fenced plot of land |
| Subnet | Lobby (public) and flats (private) |
| Internet Gateway | The main gate |
| NAT Gateway | The delivery counter |
| Security Group | The door guard (one per server) |
| Network ACL (NACL) | The gate guard (one per subnet) |
| Load Balancer | The receptionist |
| VPN | A secret tunnel |
| VPC peering | A private road to a neighbour |

## The moving objects

| Packet | Meaning |
| --- | --- |
| ✉️ Envelope | A visitor's request |
| 💾 Floppy disk | Data being saved (web → app → database) |
| 🔁 Repeat arrows | The database copying itself to the other building |
| 📦 Package | A software update leaving through the NAT and the gate |
| 😈 Devil | An intruder, stopped at the private subnet |
| 🔒 Lock | Office traffic through the VPN tunnel |
| 🤝 Handshake | Traffic over the VPC peering link to the partner |

## The 9 steps

Clicking a step shows that step and everything before it. Clicking an earlier step goes back.

1. **The fenced plot (VPC):** the AWS Cloud region and the VPC (10.0.0.0/16).
2. **Two buildings (Availability Zones):** zones A and B.
3. **Lobby and flats (subnets):** a public (gold) and a private (purple) subnet in each zone.
4. **The main gate (Internet Gateway):** the gate, "The Internet", "Visitors", a route table, and a first envelope.
5. **The receptionist (Load Balancer):** web servers in both zones; requests are shared.
6. **Back office and vault:** app servers, a database, and a live copy in zone B.
7. **The delivery counter (NAT Gateway):** a software update leaves through NAT and the gate.
8. **Guards everywhere:** Security Group tags, NACL tags, and a blocked intruder.
9. **Tunnel and private road:** an office VPN and a peered Partner VPC.

The sidebar also has **Auto-play** (moves to the next step every 5 seconds) and **Reset**.

## Run it locally

```bash
cd vpc-visual
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser. (Opening `index.html` directly also works in most browsers.)

## Host it on GitHub Pages

1. Create a new repository on GitHub and upload the contents of the `vpc-visual` folder (so `index.html` is at the top level of the repo).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose the **main** branch and the **/ (root)** folder, then click **Save**.
5. Wait a minute or two. Your site appears at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are.

## Project structure

```
vpc-visual/
├── index.html        page structure only
├── css/
│   └── style.css     page + diagram styling, light/dark mode, animations
├── js/
│   └── app.js        builds the SVG, holds the step data and caption text
├── .nojekyll
├── LICENSE           MIT (replace "YOUR NAME")
└── README.md
```

## Customise it

**Text.** Open `js/app.js`. At the top, `STEPS` holds each step's button title, subtitle and the four caption parts (title, plain words, technical name, what to watch). `LEGEND` holds the list of moving objects. Labels drawn inside the diagram are the `txt(...)` calls further down.

**Colours.** Open `css/style.css`. The diagram colours are variables at the top of the file:

| Variable | Used for |
| --- | --- |
| `--c-blue` | AWS Cloud, zones, load balancer |
| `--c-teal` | the VPC, peering |
| `--c-gold` | public subnets |
| `--c-purple` | private subnets |
| `--c-red` | security (guards, intruder) |
| `--c-green` | office VPN link |
| `--bg`, `--panel`, `--ink`, `--accent` | the page around the diagram (they switch for dark mode) |

**Motion.** The dashed wires and moving packets respect the browser's "reduce motion" setting. Each packet is created with `packet(...)` in `js/app.js`; change `dur` to make it faster or slower.

## Licence

MIT. See [LICENSE](LICENSE). Replace `YOUR NAME` with your own name.
