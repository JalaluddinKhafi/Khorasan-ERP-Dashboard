| `/api/me` | Current user, role and display name |
| `/api/dashboard` | Live counts, current-month sales/profit, low-stock and latest sales |
| `/api/products`, `/categories`, `/customers`, `/suppliers`, `/employees`, `/users`, `/content` | GET list, POST create, PUT `/{id}`, DELETE `/{id}` (admin; referenced records cannot be deleted) |
| `/api/currencies` | GET list, POST create, PUT `/{code}`; USD rate always 1 |
| `/api/invoices?kind=SALE` or `PURCHASE` | List invoices with linked payment total |
| `/api/invoices/{id}` | GET details/items; DELETE performs an audited reversal, not physical deletion |
| `/api/invoices` | POST: `request_key` UUID, `kind`, `party_id`, `invoice_date` ISO, `currency`, `rate`, `discount`, `notes`, `items:[{product_id,quantity,price}]` |
| `/api/payments` | GET list; POST UUID `request_key`, `party_id`, optional `invoice_id`, `payment_date`, `currency`, `rate`, `amount`, `notes` |
| `/api/expenses` | Admin GET list; POST UUID `request_key`, `expense_date`, `category`, `currency`, `rate`, `amount`, `notes` |
