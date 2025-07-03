# 🤖 LM Studio MCP Sidekick

A lightweight Model Context Protocol (MCP) server that connects to your local LM Studio instance for context offload and menial task automation. Perfect for handling repetitive tasks without consuming valuable context in your main AI interactions.

## 🎯 Purpose

This MCP sidekick is designed to:
- **Offload Context**: Process large amounts of context that would consume main AI conversation space
- **Automate Menial Tasks**: Handle repetitive operations like summarization, formatting, extraction
- **Batch Processing**: Efficiently process multiple similar items
- **24/7 Availability**: Local AI that doesn't count against usage limits
- **Privacy**: All processing happens locally on your machine

## 🛠️ Prerequisites

- **Node.js** >= 18.0.0
- **LM Studio** running locally with API server enabled
- **Recommended Model**: Qwen2.5-Coder-32B-Instruct-Q4_K_M (optimized for A5000 24GB)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/SamuraiBuddha/lm-studio-mcp-sidekick.git
cd lm-studio-mcp-sidekick
npm install
```

### 2. Configure Environment
```bash
cp env.template .env
# Edit .env with your LM Studio settings
```

### 3. Start LM Studio API Server
1. Open LM Studio
2. Load your preferred model (recommend Qwen2.5-Coder-32B)
3. Go to **Local Server** tab
4. Click **Start Server** (default: http://localhost:1234)

### 4. Run the MCP Server
```bash
npm start
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# LM Studio Connection
LM_STUDIO_API_URL=http://localhost:1234/v1
LM_STUDIO_API_KEY=lm-studio-placeholder-key  
LM_STUDIO_MODEL_NAME=Qwen2.5-Coder-32B-Instruct-Q4_K_M

# MCP Settings
MCP_SERVER_NAME=lm-studio-sidekick
MCP_LOG_LEVEL=info

# Context Management
MAX_CONTEXT_LENGTH=32768
CONTEXT_OFFLOAD_THRESHOLD=28000
```

### Connecting to Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "lm-studio-sidekick": {
      "command": "node",
      "args": ["path/to/lm-studio-mcp-sidekick/src/index.js"],
      "env": {
        "LM_STUDIO_API_URL": "http://localhost:1234/v1"
      }
    }
  }
}
```

## 🛠️ Available Tools

### 1. `offload_context`
Process large amounts of context that would otherwise consume main conversation space.

**Parameters:**
- `context` (string): The context or information to process
- `task` (string): The specific task to perform
- `complexity` (enum): 'low', 'medium', 'high' - affects processing approach

**Example Use:**
```
Please use the offload_context tool to analyze this 50-page document and extract the key technical requirements.
```

### 2. `automate_menial_task`
Handle simple, repetitive tasks automatically.

**Parameters:**
- `task_type` (enum): 'summarize', 'extract', 'format', 'validate', 'classify'
- `input_data` (string): Data to process
- `output_format` (string): Desired output format

**Example Use:**
```
Use automate_menial_task to summarize these 20 customer feedback emails into bullet points.
```

### 3. `batch_process`
Process multiple similar items efficiently.

**Parameters:**
- `items` (array): Array of items to process
- `operation` (string): Operation to perform on each item
- `batch_size` (integer): Items per batch (1-50, default: 10)

**Example Use:**
```
Use batch_process to validate these 100 email addresses and check which ones are properly formatted.
```

### 4. `health_check`
Check the connection status and health of the LM Studio integration.

**Example Use:**
```
Run health_check to verify the LM Studio connection is working properly.
```

## 💡 Usage Patterns

### Context Offload Strategy
When your main conversation is getting long:
1. Use `offload_context` to process background information
2. Get summaries or extracted insights back
3. Continue main conversation with key points only

### Menial Task Automation
For repetitive work:
1. Use `automate_menial_task` for single operations
2. Use `batch_process` for multiple similar items
3. Let local AI handle the grunt work while you focus on strategy

### Integration with Main Claude Sessions
- Use sidekick for data processing, formatting, validation
- Keep strategic discussions in main Claude conversation
- Reference sidekick results as needed in main conversation

## 🔍 Monitoring & Logs

### Log Files
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only

### Health Monitoring
```bash
# Check if MCP server is running
ps aux | grep "lm-studio-mcp-sidekick"

# Check LM Studio API connectivity
curl http://localhost:1234/v1/models
```

## 🛡️ Security

This MCP follows enterprise security practices:
- ✅ Comprehensive `.gitignore` prevents secret leakage
- ✅ Environment-based configuration
- ✅ Security templates included
- ✅ Local-only processing (no external API calls)
- ✅ Rate limiting and request validation

See [SECURITY.md](SECURITY.md) for complete security documentation.

## 🧪 Development

### Running in Development Mode
```bash
npm run dev  # Auto-restart on file changes
```

### Testing
```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
```

### Linting & Security
```bash
npm run lint          # Check code style
npm run lint:fix      # Fix auto-fixable issues
npm run security:check   # Security audit
```

## 📊 Performance Considerations

### Model Selection
- **Qwen2.5-Coder-32B-Q4_K_M**: Best balance (recommended)
  - VRAM: ~18-20GB
  - Speed: Excellent
  - Quality: High
  
- **DeepSeek-Coder-V2-Lite-16B**: Lighter alternative
  - VRAM: ~12-14GB
  - Speed: Excellent
  - Quality: Good

### Optimization Tips
- Use appropriate `complexity` levels for context offload
- Batch similar operations together
- Monitor VRAM usage in LM Studio
- Adjust `batch_size` based on available resources

## 🤝 Integration Examples

### With Jordan's Tool Ecosystem
```javascript
// Example: Integrate with existing MCP tools
// 1. Use GitHub MCP to fetch repository data
// 2. Use sidekick to process/analyze the data
// 3. Use main Claude for strategic decisions
```

### Workflow Automation
```bash
# Example cron job for automated processing
0 */6 * * * cd /path/to/lm-studio-mcp-sidekick && npm run batch-process-emails
```

## 🐛 Troubleshooting

### Common Issues

**"Failed to communicate with LM Studio"**
- Check LM Studio server is running
- Verify API URL in `.env`
- Ensure model is loaded in LM Studio

**"Tool execution failed"**
- Check logs in `logs/error.log`
- Verify input parameters match schema
- Test with `health_check` tool first

**High Memory Usage**
- Reduce `batch_size` for batch operations
- Use lower `complexity` settings
- Consider lighter model if needed

### Debug Mode
```bash
DEBUG_MODE=true npm start
```

## 📈 Roadmap

- [ ] Web UI for monitoring and configuration
- [ ] Plugin system for custom tools
- [ ] Integration with more local AI backends
- [ ] Advanced context management features
- [ ] Performance analytics and optimization

## 🙏 Acknowledgments

Built for the **Tool-Combo-Chains architecture** (Memory × Sequential × Sandbox = 100x amplification) to maximize productivity through AI collaboration.

---

**Author**: Jordan Ehrig (jordan@ehrigbim.com)  
**License**: MIT  
**Repository**: https://github.com/SamuraiBuddha/lm-studio-mcp-sidekick
