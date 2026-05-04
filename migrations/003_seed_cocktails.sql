-- Bar Helper — seed receptů z menu
-- Spusť v Supabase SQL Editor. Idempotentní (vloží jen pokud recept se stejným názvem ještě není).

insert into cocktails (name, steps)
select 'Aperol Spritz', E'Velký balón / vinná sklenice\nNaplnit ledem až po okraj\n90 ml Prosecco\n60 ml Aperol\nSplash sody\nJemně promíchat barovou lžící\nGarnýr: plátek pomeranče\nServírovat s brčkem'
where not exists (select 1 from cocktails where name = 'Aperol Spritz');

insert into cocktails (name, steps)
select 'Gin and Tonic', E'Balón nebo highball, vychlazený\nNaplnit ledem (hodně velkých kostek — méně tají)\n50 ml Beefeater gin\nDoplnit Schweppes Indian tonicem (cca 150 ml)\nLehce promíchat zdola nahoru, aby zůstaly bublinky\nGarnýr: plátek citronu nebo limetky, případně pár bobulí jalovce\nServírovat s brčkem'
where not exists (select 1 from cocktails where name = 'Gin and Tonic');

insert into cocktails (name, steps)
select 'Moscow Mule', E'Měděný hrnek nebo highball\nNaplnit ledem\n50 ml vodky\n15 ml čerstvé limetkové šťávy\nDoplnit ginger beerem (cca 120 ml)\nJemně promíchat\nGarnýr: plátek limetky + lístky máty (plácnout do dlaně pro vůni)\nServírovat s brčkem'
where not exists (select 1 from cocktails where name = 'Moscow Mule');

insert into cocktails (name, steps)
select 'Espresso Tonic', E'Highball, vychlazený\nNaplnit ledem až po okraj\nDoplnit Schweppes Indian tonicem (cca 150 ml)\nUvařit single espresso (30 ml)\nPomalu vlít espresso přes barovou lžíci na led — vrstvit, NE míchat\nGarnýr: pomerančová kůra (přejet po okraji sklenice)\nServírovat s brčkem, hostovi řekni ať promíchá až u stolu'
where not exists (select 1 from cocktails where name = 'Espresso Tonic');
