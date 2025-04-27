export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { query } = req.body;

  const apiKey = process.env.MONDAY_API_KEY;

  const graphqlQuery = {
    query: `
      query {
        items_by_column_values(
          board_id: YOUR_BOARD_ID,
          column_id: "name",
          column_value: "${query}"
        ) {
          id
          name
          column_values {
            title
            text
          }
        }
      }
    `
  };

  try {
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(graphqlQuery)
    });

    const data = await response.json();

    res.status(200).json({ results: data.data.items_by_column_values });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to fetch from Monday.com' });
  }
}
