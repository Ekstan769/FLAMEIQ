import { Router } from 'express';
import listEndpoints from 'express-list-endpoints';

const router = Router();

router.get('/', (req, res) => {
  const app = req.app;
  const routes = listEndpoints(app);
  
  let html = `
    <style>
      body { font-family: Arial, sans-serif; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
    <h1>Available Routes</h1>
    <table>
      <thead>
        <tr>
          <th>Path</th>
          <th>Methods</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  routes.forEach(route => {
    html += `
      <tr>
        <td>${route.path}</td>
        <td>${route.methods.join(', ')}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  res.send(html);
});

export default router;
