# The Storm in Kagoshima
### How Sourcing Sentinel gave my friend Kenji a day he never knew he needed

---

## Meet Kenji

My friend Kenji Mori runs **Mori Seimitsu**, a precision workshop wedged into Ōta-ku — that dense little quarter of small factories under Tokyo's southern flightpath, where a single street can hold a dozen shops that quietly machine parts for the whole world. His father opened it. Kenji took it over with nine employees, a row of CNC machines he knows by their sounds, and the kind of pride in *monozukuri* — the art of making things well — that doesn't fit on a spreadsheet.

Mori Seimitsu assembles compact precision handheld units for one major customer, shipping under four product codes: **A-100, A-110, B-200, B-210**. Kenji is the owner. He is also the salesman, the bookkeeper, the quality inspector, and the man who sweeps the floor at the end of the day. There is no procurement department. There is no risk officer. There is no treasury desk. There is just Kenji.

Three suppliers matter most to him:

- **Tanaka Seiko** in Kagoshima, down on Kyushu, machines his **M3 titanium bolt** — 12,000 a month. He's bought from them for years. They're his only source for that bolt. It goes into *all four* of his product lines.
- **Maruyama Plastics** in Osaka makes his ABS housings.
- **Shenzhen MicroTech** in China supplies his control IC — priced, like most chips, in **US dollars**.

That setup is beautifully efficient. One trusted source per part, no waste, no slack. And that efficiency is exactly the trap. Because if the titanium bolt stops, *everything* stops — and the bolt comes from one shop, in one town, eleven hundred kilometers away, in a part of Japan the typhoons find first.

---

## The Tuesday that almost happened

Here is the Tuesday Kenji would have lived without us.

A typhoon spins up south of Kyushu late on a Monday night. By Tuesday morning it's tracking straight toward Kagoshima — landfall in a day and a half. The same morning, the yen slips about **3%** against the dollar, and titanium, his bolt's raw material, jumps **8%** on the commodity markets.

Three things, three different screens, three different worlds — weather, currency, metals. No single one of them is shouting Kenji's name. And Kenji isn't looking anyway. He's on the floor all day, elbow-deep in a tolerance problem on the B-200 run. Tuesday closes. Wednesday. Thursday.

**Friday**, the phone rings. It's Tanaka-san, and his voice is heavy with apology. The road to the workshop flooded; the line was down for days; the next shipment of bolts will slip about two weeks. By the time Kenji hangs up, the damage has already compounded in ways he can't undo:

- The titanium price rise is **locked in** — he's now paying more per bolt, on every bolt, for the foreseeable future.
- The weaker yen has quietly made his dollar-priced control IC more expensive too — a second leak he never noticed.
- He scrambles for an alternate bolt supplier, but everyone he calls quotes **five-week lead times**. Friday afternoon is a terrible time to go shopping for capacity.
- All four product lines — A-100, A-110, B-200, B-210 — stall together, because they all wait on the same bolt.
- His customer's delivery slips. There's a penalty clause. There's a relationship that took his father twenty years to build, now strained over something Kenji "should have caught."

The cruelest part: the disruption was *knowable on Monday night.* The typhoon, the yen, the titanium — all of it was sitting in plain sight, in public data, the whole time. Nothing connected the dots to **Kenji's** bolt, **Kenji's** four products, and **Kenji's** margin. So he found out on Friday, in pain, with the worst options left on the table.

---

## The Tuesday that actually happened

Now rewind. Same storm. Same yen. Same titanium. But this time, something is watching the horizon for Kenji — the 24/7 risk desk a nine-person shop could never afford to hire. We built it for him. We call it **Sourcing Sentinel.**

A couple of weeks earlier, Kenji had done the one thing it asks of him: he uploaded what he already had. A slightly crooked **photo of his Bill of Materials**, and two crumpled supplier invoices. He didn't re-key anything into a clean database — he doesn't have one. The system's **intake agent** read the messy paperwork directly, the way a person would, and quietly built a structured *watch list*: every part, its supplier, the supplier's region, the currency he buys it in, the quantities, the lead times, and which finished products each part feeds. The titanium bolt, it noted, sits under all four SKUs. One part, four products. It remembered that.

**6:40 on Tuesday morning.** While Kenji is still asleep, four specialist agents wake up *at the same time* and each go looking at one slice of the world:

- The **weather agent** sees a severe typhoon bearing down on **Kagoshima** — landfall in roughly 36 hours.
- The **FX agent** sees the yen down about **3%** against the dollar.
- The **commodity agent** sees **titanium up 8%**.
- The **news agent** scans for shutdowns and strikes near his suppliers.

On their own, four harmless little facts. But then the **impact agent** fuses them against Kenji's watch list, and the picture snaps into focus around a single line item: **the M3 titanium bolt.** Tanaka Seiko is sitting *directly in the typhoon's path* — and titanium just spiked at the same moment. That one part feeds A-100, A-110, B-200, *and* B-210. The system estimates the likely delay, tallies up the recurring cost drag (the pricier titanium on every bolt, the yen slide quietly inflating the dollar-priced IC), and flags the real stakes: **all four product lines are exposed this month.** It scores the risk **4 out of 5** and puts a yen figure on the table — clearly labeled an estimate, a decision aid, not a prophecy.

Then the **response coordinator** decides what kind of move the situation calls for: this one is supply-driven *and* cost-driven, so — **re-source the bolt, and hedge.** And here's the part I'm proudest of. It doesn't just blurt out the first alternate it finds. A **planner** proposes one; a **critic** immediately rejects it — *five-week lead time, too slow for a two-week gap, infeasible.* So the planner tries again. The second candidate, a shop in Nagano, can ship in **nine days** with a slightly higher minimum order. The critic checks it against the disruption window and passes it. Only a plan that survives that argument is allowed to reach Kenji.

Finally, the **comms agent** does the thing Kenji dreads most when he's in a hurry: it writes the careful emails. Two of them, ready to send — a polite, properly deferential **keigo** note to Tanaka-san asking for status and a partial early shipment, and a clean **request-for-quote** to the Nagano alternate. Each one with an **English version** sitting right beside it. The paperwork tax, prepaid.

Kenji reads **one screen** over his morning coffee. He sends the expedite note. He fires off the RFQ. He picks up the phone and warns his customer that there might be a small blip — *on Tuesday, not Friday.* The Nagano shop locks his slot before anyone else thinks to call them. The hedge caps his titanium bleed. The delivery holds. The month stays in the black.

He acted **a day early.** That was the whole game.

---

## Same storm, two Kenjis

The storm was identical in both timelines. The yen fell the same amount. Titanium rose the same amount. Tanaka Seiko's road flooded just the same.

The only difference between the Kenji who ends the month with a penalty and a bruised relationship, and the Kenji who barely feels it, is **a single day of warning** and **one act of translation** — turning "typhoon near Kyushu" into *"your titanium bolt, your four products, your yen, this month, here's what to do, here's the email — send it."*

I want to be honest about what it is and isn't. The yen figures and delay estimates are exactly that — estimates, meant to inform Kenji's judgment, never to replace it. Sourcing Sentinel doesn't order anything. It doesn't sign anything. It hands Kenji back his own decision with time still on the clock. *Action, not anxiety.*

And Kenji isn't unusual. He's one of roughly **3.36 million** small and medium firms that make up **99.7%** of Japan's companies — the lean, single-sourced *monozukuri* shops that sit at the quiet center of the world's supply chains, operating in the most volatile input environment in a generation. They don't need another dashboard of blinking numbers. They need something that watches the horizon for them and tells them what to do **while there's still time to do it.**

That's what we built for Kenji.

That's Sourcing Sentinel.

---

*A note on the details: "Kenji Mori" and "Mori Seimitsu" are stand-ins you can rename to a real friend or a fictional one — the supply chain itself (Kagoshima titanium bolt, Osaka housing, Shenzhen IC, four SKUs, the typhoon + 3% yen + 8% titanium trigger) is drawn straight from your project's seed data and demo scenario, so the story and the live demo tell exactly the same tale.*
