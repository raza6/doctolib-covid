const { execSync } = require("child_process");
const dayjs = require('dayjs');
const Twit = require('twit');
const fs = require('fs');

const twitcred = fs.readFileSync('twitcred.json');
const twitcredjson = JSON.parse(twitcred);
const twit = new Twit(twitcredjson);
const twitto = '556914714';

centers = [
    'centre-de-vaccination-covid-19-du-centre-commercial-alma',
    'centre-de-vaccination-covid-19-sos-medecins-rennes',
    'centre-de-vaccination-covid-19-vaccimobile-35-ars-communes-ile-et-vilaine'
]

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
    let tok = false;
    try {
        let tresult = await twit.get('account/verify_credentials', { skip_status: true })
        console.log(`Connected successfully to twitter account @${tresult.data.screen_name}`);
        tok = true;
    } catch (err) {
        console.error('Connection to twitter.com failed. Check your credentials.', err.stack);
    }
    
    if (tok) {
        for (const center of centers) {
            execSync(`curl https://www.doctolib.fr/booking/${center}.json -s -o data.json --user-agent 'Chrome/79'`);
            await sleep(3000);
        
            findVacc(JSON.parse(fs.readFileSync('data.json')).data, center);
        }
    }
}

function findVacc(data, center) {
    console.log('Looking for', center);

    let valid_visit_motives = data.visit_motives.filter(v => v.name.includes('Pfizer') && v.name.includes('3'));
    if (valid_visit_motives.length === 0) {
        console.error('No valid visit motive for', center);
        return;
    }

    let places = [...data.places];
    if (places.length === 0) {
        console.error('No places left for', center);
        return;
    }

    for (let place of places) {
        let start_date = dayjs().format('YYYY-MM-DD');
        let visit_motive_id = valid_visit_motives[0].id;
        let practice_id = place.practice_ids[0];
        let place_name = place.formal_name;
        let place_address = place.full_address;

        let agendas = data.agendas.filter(a => 
            a.practice_id === practice_id &&
            !a.booking_disabled &&
            a.visit_motive_ids.includes(visit_motive_id)
        );

        if (agendas.length === 0) {
            console.error('No agenda for center', center);
            return;
        }

        execSync(`curl "https://www.doctolib.fr/availabilities.json?start_date=${start_date}&visit_motive_ids=${visit_motive_id}&agenda_ids=${agendas.map(a => a.id).join('-')}&insurance_sector=public&practice_ids=${practice_id}&limit=4" -s -o availabilities.json --user-agent 'Chrome/79'`);
        
        let avail = JSON.parse(fs.readFileSync('availabilities.json'))
        if (avail.total > 0 || avail.next_slot) {
            console.log(avail.total, 'in', center, 'next slot', avail.next_slot ? dayjs(avail.next_slot).format('YYYY-MM-DD') : 'this week');
            console.log(`https://www.doctolib.fr/vaccination-covid-19/rennes/${center}`)
            let msg = `${avail.total} pfizer available in ${center} next slot ${avail.next_slot ? dayjs(avail.next_slot).format('YYYY-MM-DD') : 'this week'}\n Right there -> https://www.doctolib.fr/vaccination-covid-19/rennes/${center}`;
            twit.post('direct_messages/events/new', {"event": {"type": "message_create", "message_create": {"target": {"recipient_id": twitto}, "message_data": {"text": msg}}}});
        }
    }
}

start();
