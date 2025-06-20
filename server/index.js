const express = require('express');
const sql = require('mssql');
const config = {
    user: 'sa',
    password: 'TrustMeBr0P@ssw0rd!',
    server: 'db',
    database: 'DemoDB',
    options: {
        trustServerCertificate: true
    }
};
const app = express();
app.use(express.urlencoded({
    extended: true
}));

app.get('/static', async (req, res) => {
    const id = req.query.id;
    const query = `SELECT title FROM static_table WHERE id = '${id}'`;
    try {
        const pool = await sql.connect(config);
        const result = await pool.query(query);
        res.send(result.recordset.length > 0 ? "TRUE" : "FALSE");
    } catch (e) {
        res.send("ERROR");
    }
});

app.listen(3000, () => console.log('Listening on 3000'));