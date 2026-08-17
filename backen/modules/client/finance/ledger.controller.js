// ledger.controller.js

export const getLedger = async (req, res) => {
  try {
    const revenue = await Revenue.findAll();
    const expense = await Expense.findAll();

    const ledger = [
      ...revenue.map(r => ({
        date: r.date,
        description: r.title,
        credit: r.amount,
        debit: 0
      })),
      ...expense.map(e => ({
        date: e.date,
        description: e.title,
        credit: 0,
        debit: e.amount
      }))
    ];

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    const finalLedger = ledger.map(item => {
      balance += item.credit - item.debit;
      return { ...item, balance };
    });

    res.json(finalLedger);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};