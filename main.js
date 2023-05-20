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

pass.end()

const commandBuffer = encoder.finish()

device.queue.submit([commandBuffer])

// Finish the command buffer and immediately submit it.
device.queue.submit([encoder.finish()]);
