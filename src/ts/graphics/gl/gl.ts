import { assert } from "@debug/assert";
import { WHITE } from "@graphics/colour";
import { math } from "math";

let webgl_context: WebGLRenderingContext;
let width: number;
let height: number;

// xy + uv + argb
let VERTEX_SIZE: number = (4 * 2) + (4 * 2) + (4) + (4);
let MAX_BATCH: number = 10922;
let VERTICES_PER_QUAD: number = 6;
let VERTEX_DATA_SIZE: number = VERTEX_SIZE * MAX_BATCH * 4;
let INDEX_DATA_SIZE: number = MAX_BATCH * (2 * VERTICES_PER_QUAD);

let vertex_data: ArrayBuffer = new ArrayBuffer(VERTEX_DATA_SIZE);
let position_data: Float32Array = new Float32Array(vertex_data);
let colour_data: Uint32Array = new Uint32Array(vertex_data);
let palette_data: Float32Array = new Float32Array(vertex_data);
let index_data: Uint16Array = new Uint16Array(INDEX_DATA_SIZE);

let matrix: Float32Array = new Float32Array([1, 0, 0, 1, 0, 0]);
let matrix_stack: Float32Array = new Float32Array(100);
let stack_pointer: number = 0;

let index_buffer: WebGLBuffer;
let vertex_buffer: WebGLBuffer;
let count: number = 0;

export let gl_get_context = (canvas: HTMLCanvasElement): WebGLRenderingContext =>
{
  width = canvas.width;
  height = canvas.height;
  let context = canvas.getContext("webgl", { antialias: false, powerPreference: "high-performance" });
  assert(context !== null, "Unable to get GL context.");
  return context;
};

export let gl_init = (context: WebGLRenderingContext): void =>
{
  webgl_context = context;

  let compile_shader = (source: string, type: number): WebGLShader =>
  {
    let shader = webgl_context.createShader(type);
    assert(shader !== null, "Unable to created shader");
    webgl_context.shaderSource(shader, source);
    webgl_context.compileShader(shader);
    return shader;
  };

  let create_shader_program = (vertex_shader_source: string, fragment_shader_source: string): WebGLProgram =>
  {
    let program = webgl_context.createProgram();
    assert(program !== null, "Unable to created program");
    let vShader: WebGLShader = compile_shader(vertex_shader_source, 35633);
    if (DEBUG) console.log(webgl_context.getShaderInfoLog(vShader));
    let fShader: WebGLShader = compile_shader(fragment_shader_source, 35632);
    if (DEBUG) console.log(webgl_context.getShaderInfoLog(fShader));
    webgl_context.attachShader(program, vShader);
    webgl_context.attachShader(program, fShader);
    webgl_context.linkProgram(program);
    return program;
  };

  let create_buffer = (bufferType: number, size: number, usage: number): WebGLBuffer =>
  {
    let buffer = webgl_context.createBuffer();
    assert(buffer !== null, "Unable to created buffer");
    webgl_context.bindBuffer(bufferType, buffer);
    webgl_context.bufferData(bufferType, size, usage);
    return buffer;
  };

  let shader: WebGLShader = create_shader_program(
    "precision lowp float;attribute vec2 v,t;varying vec2 uv;attribute vec4 c;varying vec4 fc;attribute float po;varying float fpo;uniform mat4 m;void main(){gl_Position=m*vec4(v,1.0,1.0);uv=t;fc=c;fpo=po;}",
    "precision lowp float;varying vec2 uv;varying vec4 fc;varying float fpo;uniform sampler2D s;uniform sampler2D p;void main(){if(fpo==0.0){gl_FragColor=texture2D(s,uv)*fc;}else{float index=texture2D(s,uv).r*8.0-1.0;gl_FragColor=vec4(texture2D(p,vec2((index+fpo+0.5)/256.0,0.5)).rgb,texture2D(s,uv).a);}}"
  );

  index_buffer = create_buffer(34963, index_data.byteLength, 35044);
  vertex_buffer = create_buffer(34962, vertex_data.byteLength, 35048);

  webgl_context.blendFunc(770, 771);
  webgl_context.enable(3042);
  webgl_context.useProgram(shader);
  webgl_context.bindBuffer(34963, index_buffer);
  for (let indexA: number = 0, indexB: number = 0; indexA < MAX_BATCH * VERTICES_PER_QUAD; indexA += VERTICES_PER_QUAD, indexB += 4)
  {
    index_data[indexA + 0] = indexB;
    index_data[indexA + 1] = indexB + 1;
    index_data[indexA + 2] = indexB + 2;
    index_data[indexA + 3] = indexB + 0;
    index_data[indexA + 4] = indexB + 3;
    index_data[indexA + 5] = indexB + 1;
  }

  webgl_context.bufferSubData(34963, 0, index_data);
  webgl_context.bindBuffer(34962, vertex_buffer);

  let atlas_uniform_location = webgl_context.getUniformLocation(shader, "s");
  webgl_context.uniform1i(atlas_uniform_location, 0);

  let pallete_uniform_location = webgl_context.getUniformLocation(shader, "p");
  webgl_context.uniform1i(pallete_uniform_location, 1);

  let gl_getAttribLocation = webgl_context.getAttribLocation.bind(webgl_context);

  let vertex_attribute = gl_getAttribLocation(shader, "v");
  let texture_attribute = gl_getAttribLocation(shader, "t");
  let colour_attribute = gl_getAttribLocation(shader, "c");
  let pallete_offset_attribute = gl_getAttribLocation(shader, "po");

  let gl_enableVertexAttribArray = webgl_context.enableVertexAttribArray.bind(webgl_context);
  let gl_vertexAttribPointer = webgl_context.vertexAttribPointer.bind(webgl_context);

  gl_enableVertexAttribArray(vertex_attribute);
  gl_vertexAttribPointer(vertex_attribute, 2, GL_FLOAT, false, VERTEX_SIZE, 0);

  gl_enableVertexAttribArray(texture_attribute);
  gl_vertexAttribPointer(texture_attribute, 2, GL_FLOAT, false, VERTEX_SIZE, 8);

  gl_enableVertexAttribArray(colour_attribute);
  gl_vertexAttribPointer(colour_attribute, 4, GL_UNSIGNED_BYTE, true, VERTEX_SIZE, 16);

  gl_enableVertexAttribArray(pallete_offset_attribute);
  gl_vertexAttribPointer(pallete_offset_attribute, 1, GL_FLOAT, false, VERTEX_SIZE, 20);

  webgl_context.uniformMatrix4fv(webgl_context.getUniformLocation(shader, "m"), false, new Float32Array([2 / width, 0, 0, 0, 0, -2 / height, 0, 0, 0, 0, 1, 1, -1, 1, 0, 0]));

  webgl_context.clearColor(0, 0, 0, 1);
};

export let gl_upload_texture = (image: HTMLImageElement | HTMLCanvasElement, texture_slot: number): void =>
{
  let gl_texParameteri = webgl_context.texParameteri.bind(webgl_context);
  webgl_context.activeTexture(texture_slot);
  let texture = webgl_context.createTexture();
  assert(texture !== null, "Unable to create texture.");
  webgl_context.bindTexture(GL_TEXTURE2D, texture);
  gl_texParameteri(GL_TEXTURE2D, 10242, 33071);
  gl_texParameteri(GL_TEXTURE2D, 10243, 33071);
  gl_texParameteri(GL_TEXTURE2D, 10240, 9728);
  gl_texParameteri(GL_TEXTURE2D, 10241, 9728);
  webgl_context.texImage2D(GL_TEXTURE2D, 0, 6408, 6408, 5121, image);
};

export let gl_clear = (): void =>
{
  webgl_context.clear(16384);
};

export let gl_translate = (x: number, y: number): void =>
{
  matrix[4] = matrix[0] * x + matrix[2] * y + matrix[4];
  matrix[5] = matrix[1] * x + matrix[3] * y + matrix[5];
};

export let gl_scale = (x: number, y: number): void =>
{
  matrix[0] *= x;
  matrix[1] *= x;
  matrix[2] *= y;
  matrix[3] *= y;
};

export let gl_rotate = (r: number): void =>
{
  let sr: number = math.sin(r);
  let cr: number = math.cos(r);

  matrix[0] = matrix[0] * cr + matrix[2] * sr;
  matrix[1] = matrix[1] * cr + matrix[3] * sr;
  matrix[2] = matrix[0] * -sr + matrix[2] * cr;
  matrix[3] = matrix[1] * -sr + matrix[3] * cr;
};

export let gl_save = (): void =>
{
  matrix_stack[stack_pointer + 0] = matrix[0];
  matrix_stack[stack_pointer + 1] = matrix[1];
  matrix_stack[stack_pointer + 2] = matrix[2];
  matrix_stack[stack_pointer + 3] = matrix[3];
  matrix_stack[stack_pointer + 4] = matrix[4];
  matrix_stack[stack_pointer + 5] = matrix[5];
  stack_pointer += 6;
};

export let gl_restore = (): void =>
{
  stack_pointer -= 6;
  matrix[0] = matrix_stack[stack_pointer + 0];
  matrix[1] = matrix_stack[stack_pointer + 1];
  matrix[2] = matrix_stack[stack_pointer + 2];
  matrix[3] = matrix_stack[stack_pointer + 3];
  matrix[4] = matrix_stack[stack_pointer + 4];
  matrix[5] = matrix_stack[stack_pointer + 5];
};

export let gl_push_textured_quad = (pallete_offset: number, x: number, y: number, w: number, h: number, u0: number, v0: number, u1: number, v1: number, aabbggrr: number = WHITE): void =>
{
  let x0: number = x;
  let y0: number = y;
  let x1: number = x + w;
  let y1: number = y + h;
  let x2: number = x;
  let y2: number = y + h;
  let x3: number = x + w;
  let y3: number = y;
  let mat0: number = matrix[0];
  let mat1: number = matrix[1];
  let mat2: number = matrix[2];
  let mat3: number = matrix[3];
  let mat4: number = matrix[4];
  let mat5: number = matrix[5];

  if (count + 1 >= MAX_BATCH)
  {
    webgl_context.bufferSubData(34962, 0, vertex_data);
    webgl_context.drawElements(4, count * VERTICES_PER_QUAD, 5123, 0);
    count = 0;
  }

  let offset: number = count * VERTEX_SIZE;

  // Vertex Order
  // Vertex Position | UV | ARGB
  // Vertex 1
  position_data[offset++] = x0 * mat0 + y0 * mat2 + mat4;
  position_data[offset++] = x0 * mat1 + y0 * mat3 + mat5;
  position_data[offset++] = u0;
  position_data[offset++] = v0;
  colour_data[offset++] = aabbggrr;
  palette_data[offset++] = pallete_offset;

  // Vertex 2
  position_data[offset++] = x1 * mat0 + y1 * mat2 + mat4;
  position_data[offset++] = x1 * mat1 + y1 * mat3 + mat5;
  position_data[offset++] = u1;
  position_data[offset++] = v1;
  colour_data[offset++] = aabbggrr;
  palette_data[offset++] = pallete_offset;

  // Vertex 3
  position_data[offset++] = x2 * mat0 + y2 * mat2 + mat4;
  position_data[offset++] = x2 * mat1 + y2 * mat3 + mat5;
  position_data[offset++] = u0;
  position_data[offset++] = v1;
  colour_data[offset++] = aabbggrr;
  palette_data[offset++] = pallete_offset;

  // Vertex 4
  position_data[offset++] = x3 * mat0 + y3 * mat2 + mat4;
  position_data[offset++] = x3 * mat1 + y3 * mat3 + mat5;
  position_data[offset++] = u1;
  position_data[offset++] = v0;
  colour_data[offset++] = aabbggrr;
  palette_data[offset++] = pallete_offset;

  if (++count >= MAX_BATCH)
  {
    webgl_context.bufferSubData(34962, 0, vertex_data);
    webgl_context.drawElements(4, count * VERTICES_PER_QUAD, 5123, 0);
    count = 0;
  }
};

export let gl_flush = (): void =>
{
  if (count === 0) return;
  webgl_context.bufferSubData(34962, 0, position_data.subarray(0, count * VERTEX_SIZE));
  webgl_context.drawElements(4, count * VERTICES_PER_QUAD, 5123, 0);
  count = 0;
};
