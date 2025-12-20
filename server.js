const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body').default;
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
  static #tickets = [];
  static #nextId = 0;

  constructor(id, name, description, status, created) {
    this.id = id;
    this.name = name;
    this.description = description;

  if (typeof status === 'string') {
    const lowerStatus = status.toLowerCase();
    this.status = (lowerStatus === 'true' || lowerStatus === '1');
  } else {
    this.status = Boolean(status);
  }
    this.created = created;
  }
  
  static initializeTicket() {
    if (this.#tickets.length === 0) {
      this.#tickets.push(
        new TicketFull(
          this.#nextId++, 
          'Install new version', 
          'Install Windows 10, drivers for printer, MS Office, save documents and mediafiles', 
          false, 
          new Date()
        ),
        new TicketFull(
          this.#nextId++, 
          'Replace cartridge', 
          'Replace cartridge for printer Samsung in cabinet #404', 
          true, 
          new Date()
        )
      );
    }
  }

  static allTickets() {
    return this.#tickets.map(ticket => 
      new Ticket(ticket.id, ticket.name, ticket.status, ticket.created)
    );
  }

  static findTicket(id) {
    const result = this.#tickets.find(ticket => ticket.id === id);
    return result;
  }

  static createTicket(name, description, status = false) {
    const ticket = new TicketFull(
      this.#nextId++,
      name,
      description,
      status,
      new Date()
    );
    this.#tickets.push(ticket);
    return ticket;  
  }

  static updateTicket(id, name, description, status) {
    const ticket = this.findTicket(id);
    if (ticket) {
      ticket.name = name;
      ticket.description = description;
    if (status !== undefined) {
      // Используем ту же логику что и в конструкторе
      if (typeof status === 'string') {
        const lowerStatus = status.toLowerCase();
        ticket.status = (lowerStatus === 'true' || lowerStatus === '1');
      } else {
        ticket.status = Boolean(status);
      }
      console.log(`updateTicket: id=${id}, status обновлен на ${ticket.status}`);
    }
  }
    return ticket;
  }

  static deleteTicket(id) {
    const index = this.#tickets.findIndex(ticket => ticket.id === id);
    if (index !== -1) {
      const deleted = this.#tickets.splice(index, 1);
      return deleted.length > 0 ? deleted[0] : null;
    }
    return null;
  }
}

TicketFull.initializeTicket();

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  
  const headers = {'Access-Control-Allow-Origin': '*'};
  
  if (ctx.request.method !== 'OPTIONS') {
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH', // ✅ исправлено
    });
    
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', 
        ctx.request.get('Access-Control-Request-Headers')
      );
    }
    ctx.response.status = 204;
  }
});

app.use(async ctx => {
  const params = new URLSearchParams(ctx.request.querystring);
  const method = params.get('method');
  const id = params.get('id');
  const { body } = ctx.request;

  switch (method) {
    case 'allTickets': {
      ctx.response.body = TicketFull.allTickets();
      return; 
    }
     
    case 'ticketById': {
      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'ID parameter is required' };
        return;
      }
      
      const ticketId = parseInt(id);
      const ticket = TicketFull.findTicket(ticketId);
      
      if (ticket) {
        ctx.response.body = ticket;
      } else {
        ctx.response.status = 404;
        ctx.response.body = { error: 'Ticket not found' };
      }
      return;
    }
    
    case 'createTicket': {
      if (!body || !body.title) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Title is required' };
        return;
      }
  
      const newTicket = TicketFull.createTicket(
        body.title, 
        body.description || '',
        body.status
      );
      ctx.response.body = newTicket;
      return;
    }

    case 'editTicket': {
      if (!body || !body.id || !body.title) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'ID and title are required' };
        return;
      }
      
      const updateTicket = TicketFull.updateTicket(
      parseInt(body.id), 
      body.title, 
      body.description || '',
      body.status
      );
      ctx.response.body = updateTicket || { error: 'Ticket not found' };
      return;
    }

    case 'deleteTicket': {
      if (!body || !body.id) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'ID is required' };
        return;
      }
      
      const deleteTicket = TicketFull.deleteTicket(parseInt(body.id));
      ctx.response.body = { 
        deleted: deleteTicket !== null,
        ticket: deleteTicket
      };
      return;
    }

    default: {
      ctx.response.status = 404;
      ctx.response.body = { error: 'Method not found' };
      return;
    }
  }
});

const port = process.env.PORT || 7070;
const host = '0.0.0.0';

const server = http.createServer(app.callback()).listen(port, host, () => {
  console.log(`✅ Server running on http://${host}:${port}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});
