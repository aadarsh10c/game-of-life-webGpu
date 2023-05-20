const canvas = document.querySelector( 'canvas' )

//check if nagiator.gpu is present
if( !navigator.gpu) throw new Error( "WebGPU not supported on this browser")

//WEbGPU initalization
const adapter = await navigator.gpu.requestAdapter()

if( !adapter) throw new Error('No appropriate GPAdapter found.')

//Request for ADapter device
const device = await adapter.requestDevice()

//Confogure the canvas to be used with device
const context = canvas.getContext( 'webgpu' )

const canvasFormat = navigator.gpu.getPreferredCanvasFormat()

context.configure({
  device: device,
  format: canvasFormat
})



//Create a typed  array to hold vertices of square 
const vertices = new Float32Array([
//   X,    Y,
-0.8, -0.8, // Triangle 1 (Blue)
0.8, -0.8,
0.8,  0.8,

-0.8, -0.8, // Triangle 2 (Red)
0.8,  0.8,
-0.8,  0.8,
])
// console.log( vertices.byteLength)
//Create a gpu buffer
const vertexBuffer = device.createBuffer({
  label: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

//Copy vertices tata into the buffer
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);


//Define the vertex layout
const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [{
    format: "float32x2",
    offset: 0,
    shaderLocation: 0, // Position, see vertex shader
  }],
};


//Define vertex Shader
const cellShaderModule = device.createShaderModule({
  label: "Cell shader",
  code: `
  @vertex
  fn vertexMain(@location(0) pos: vec2f) ->
    @builtin(position) vec4f {
    return vec4f(pos, 0, 1);
  }
  @fragment
  fn fragmentMain() -> @location(0) vec4f {
    return vec4f( 1, 0, 0, 1);
  }
  `
});

//Create a render pipleline
const cellPipeline = device.createRenderPipeline({
  label: "Cell pipeline",
  layout: "auto",
  vertex: {
    module: cellShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: canvasFormat
    }]
  }
});

//Configure GPU command encoder
const encoder = device.createCommandEncoder()

//create a render pass
const pass = encoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    loadOp: 'clear',
    clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
    storeOp: 'store',
  }]
})

pass.setPipeline(cellPipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.draw(vertices.length / 2); // 6 vertices

pass.end()
//test


// Finish the command buffer and immediately submit it.
device.queue.submit([encoder.finish()]);


