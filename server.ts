import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { Environment } from "./environment";

const app = createMcpExpressApp();

// Function to create and configure the MCP server
function createServer() {
    const server = new McpServer({ name: 'hermex-server', version: '1.0.0' });

    server.registerTool(
        'get-carros',
        {
            description: 'Busca lista de carros disponíveis para locação na Hermex',
            inputSchema: objectInputSchemaListcars,
            outputSchema: z.array(objectOutputSchemaListcars)
        },
        async (input) => {

            const urlWithParams = new URL(Environment.HERMEX_API_URL + '/cars');
            
            if (input.category) {
                urlWithParams.searchParams.append('category', input.category);
            }

            const cars = await fetch(urlWithParams);
            const body = await cars.json();

            return {
                structuredContent: body
            };
        }
    );

    return server;
}

// Configure the Express app to handle MCP requests
async function handleMcpRequest(req: any, res: any) {
    const server = createServer();
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
}

app.get('/mcp', handleMcpRequest);
app.post('/mcp', handleMcpRequest);
app.delete('/mcp', handleMcpRequest);

// Start the Express server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// Define the input and output schemas for the "get-carros" tool
const objectInputSchemaListcars = z.object({
    category: z.string().optional()
});

const objectOutputSchemaListcars = z.object({
    id: z.string().max(30),
    slug: z.string(),
    name: z.string(),
    category: z.string(),
    pricePerDay: z.number(),
    image: z.string(),
    images: z.array(z.string()),
    description: z.string(),
    features: z.array(z.string()),
    seats: z.number(),
    bags: z.number(),
    transmission: z.string(),
    available: z.boolean(),
});
