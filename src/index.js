#!/usr/bin/env node

/**
 * LM Studio MCP Sidekick - Main Server Entry Point
 * 
 * A lightweight MCP server for context offload and menial task automation
 * Connects to local LM Studio instance for AI-powered assistance
 * 
 * @author Jordan Ehrig <jordan@ehrigbim.com>
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment configuration
dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lm-studio-mcp-sidekick' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB  
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * LM Studio API Client for local model communication
 */
class LMStudioClient {
  constructor() {
    this.baseURL = process.env.LM_STUDIO_API_URL || 'http://localhost:1234/v1';
    this.apiKey = process.env.LM_STUDIO_API_KEY || 'lm-studio';
    this.model = process.env.LM_STUDIO_MODEL_NAME || 'local-model';
    this.timeout = parseInt(process.env.LM_STUDIO_TIMEOUT) || 30000;
  }

  /**
   * Send completion request to LM Studio
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Model response
   */
  async complete(prompt, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.3,
          stream: false
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      logger.error('LM Studio API call failed:', error);
      throw new Error(`Failed to communicate with LM Studio: ${error.message}`);
    }
  }

  /**
   * Check if LM Studio is available
   * @returns {Promise<boolean>} - Connection status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Initialize LM Studio client
const lmStudio = new LMStudioClient();

/**
 * Tool definitions for menial task automation
 */
const TOOLS = [
  {
    name: 'offload_context',
    description: 'Offload complex context to local LM Studio for processing',
    inputSchema: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'The context or information to process'
        },
        task: {
          type: 'string', 
          description: 'The specific task to perform with the context'
        },
        complexity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Task complexity level',
          default: 'low'
        }
      },
      required: ['context', 'task']
    }
  },
  {
    name: 'automate_menial_task',
    description: 'Automate simple, repetitive tasks using local AI',
    inputSchema: {
      type: 'object',
      properties: {
        task_type: {
          type: 'string',
          enum: ['summarize', 'extract', 'format', 'validate', 'classify'],
          description: 'Type of menial task to perform'
        },
        input_data: {
          type: 'string',
          description: 'Data to process'
        },
        output_format: {
          type: 'string',
          description: 'Desired output format',
          default: 'text'
        }
      },
      required: ['task_type', 'input_data']
    }
  },
  {
    name: 'batch_process',
    description: 'Process multiple similar items in batch',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of items to process'
        },
        operation: {
          type: 'string',
          description: 'Operation to perform on each item'
        },
        batch_size: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
          description: 'Number of items to process at once'
        }
      },
      required: ['items', 'operation']
    }
  },
  {
    name: 'health_check',
    description: 'Check the health and status of the LM Studio connection',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
];

/**
 * Tool execution handlers
 */
const toolHandlers = {
  async offload_context({ context, task, complexity = 'low' }) {
    logger.info(`Context offload requested: ${task} (${complexity})`);
    
    const prompt = `Task: ${task}
Complexity: ${complexity}
Context: ${context}

Please process this context and complete the requested task. Be concise and focused.`;

    try {
      const result = await lmStudio.complete(prompt, {
        temperature: complexity === 'high' ? 0.7 : 0.3,
        maxTokens: complexity === 'high' ? 4096 : 2048
      });
      
      logger.info('Context offload completed successfully');
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    } catch (error) {
      logger.error('Context offload failed:', error);
      throw error;
    }
  },

  async automate_menial_task({ task_type, input_data, output_format = 'text' }) {
    logger.info(`Menial task automation: ${task_type}`);
    
    const taskPrompts = {
      summarize: `Summarize the following content concisely:\n\n${input_data}`,
      extract: `Extract key information from:\n\n${input_data}`,
      format: `Format the following data properly:\n\n${input_data}`,
      validate: `Validate and check the following for correctness:\n\n${input_data}`,
      classify: `Classify or categorize the following:\n\n${input_data}`
    };

    const prompt = taskPrompts[task_type] + `\n\nOutput format: ${output_format}`;

    try {
      const result = await lmStudio.complete(prompt, { temperature: 0.1 });
      
      logger.info(`Menial task completed: ${task_type}`);
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    } catch (error) {
      logger.error('Menial task automation failed:', error);
      throw error;
    }
  },

  async batch_process({ items, operation, batch_size = 10 }) {
    logger.info(`Batch processing ${items.length} items: ${operation}`);
    
    const results = [];
    
    for (let i = 0; i < items.length; i += batch_size) {
      const batch = items.slice(i, i + batch_size);
      const batchPrompt = `Operation: ${operation}
Items to process:
${batch.map((item, idx) => `${i + idx + 1}. ${item}`).join('\n')}

Process each item according to the operation and provide results.`;

      try {
        const batchResult = await lmStudio.complete(batchPrompt, { temperature: 0.2 });
        results.push(`Batch ${Math.floor(i / batch_size) + 1}:\n${batchResult}`);
        
        // Small delay between batches to be respectful
        if (i + batch_size < items.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error(`Batch processing failed at batch ${Math.floor(i / batch_size) + 1}:`, error);
        results.push(`Batch ${Math.floor(i / batch_size) + 1}: Error - ${error.message}`);
      }
    }
    
    logger.info('Batch processing completed');
    return {
      content: [{
        type: 'text',
        text: results.join('\n\n')
      }]
    };
  },

  async health_check() {
    logger.info('Health check requested');
    
    try {
      const isHealthy = await lmStudio.healthCheck();
      const status = {
        lm_studio_connection: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        model: lmStudio.model,
        api_url: lmStudio.baseURL
      };
      
      logger.info(`Health check completed: ${status.lm_studio_connection}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(status, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      throw error;
    }
  }
};

/**
 * Initialize and start the MCP server
 */
async function main() {
  logger.info('Starting LM Studio MCP Sidekick...');
  
  // Create MCP server instance
  const server = new Server(
    {
      name: 'lm-studio-mcp-sidekick',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Tools list requested');
    return { tools: TOOLS };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Tool execution requested: ${name}`);
    
    const handler = toolHandlers[name];
    if (!handler) {
      logger.error(`Unknown tool: ${name}`);
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      return await handler(args || {});
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, error);
      throw error;
    }
  });

  // Setup transport and start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('LM Studio MCP Sidekick started and ready for connections');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
