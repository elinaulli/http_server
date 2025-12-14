
﻿const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();

class Ticket {
    constructor(id, name, status, created) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.created = created;
    }
}

class TicketFull {
    constructor(id, name, description, status, created) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.status = status;
        this.created = created;

    }
}

let ticketFull = [
    new TicketFull(0, 'Install new version', 'Install Windows 10, drivers for printer, MS Office, save documents and mediafiles', false, new Date().toString().slice(4,21)),
    new TicketFull(1, 'Raplace cartridge', 'Replace cartridge for printer Samsung in cabinet #404', true, new Date().toString().slice(4,21)),
];


app.use(koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
}));

app.use( async (ctx, next) =>{
    const  origin = ctx.request.get('Origin');
    if(!origin) {
        return await next();
    }

    const headers = {'Access-Control-Allow-Origin': '*'};
    if(ctx.request.method !== 'OPTIONS'){
        ctx.response.set({...headers});
        try {
            return await next();
        } catch (e) {
            e.headers = {...e.headers, ...headers};
            throw e;
        }
    }
    if (ctx.request.get('Access-Control-Request-Method')) {
        ctx.response.set({
           ...headers,
           'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH', 
        });
        if (ctx.request.get('Access-Control-Request-Headers')) {
            ctx.response.set('Access-Control-Request-Headers', ctx.request.get('Access-Control-Request-Headers'));
        }
        ctx.response.status = 204;
    }
});


function tickets() {
    const arr = [];

    ticketFull.forEach((elem)=>{
        arr.push(new Ticket(elem.id, elem.name, elem.status, elem.created));
    });
    return arr;
}

function findTicket(id) {
    const result = ticketFull.find(ticket => ticket.id === id);
    return result;
}

app.use(async ctx =>{
    const params = new URLSearchParams(ctx.request.querystring);
    const obj = { method: params.get('method'), id: params.get('id')};
    const { method, id } = obj;
    const  {body}  = ctx.request;
    switch (method) {
        case 'allTickets':
            ctx.response.body = tickets();
            return;
        case 'ticketById':
            if (id){
                ctx.response.body = findTicket(+id);
                return;
            }
        case 'createTicket':
            const nextId = ticketFull.length;
            ticketFull.push(new TicketFull (nextId, body.title, body.description, false, new Date().toString().slice(4,21)));
            ctx.response.body = ticketFull[nextId];
            return;
        case 'editTicket':
            const index = body.id;
            ticketFull[index].name = body.title;
            ticketFull[index].description = body.description;
            ctx.response.body = ticketFull[index];
            return;
        case 'deleteTicket':
            const ind = body.id;
            ticketFull.splice(ind, 1);
            ctx.response.body = ticketFull;
            return;
        default:
            ctx.response.status = 404;
            return;
    };

})

app.use(async (ctx)=>{
    console.log('request quetystring', ctx.request.querystring);
    console.log('request.body', ctx.request.body);
    ctx.response.status = 204;
});

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port);
