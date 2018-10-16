﻿
export abstract class FGeometryShaders {
    private static VertexShaderCode: string =
        'precision mediump float;' +
        'attribute vec3 aPosition;' +
        'attribute vec2 aTexcoord;' +
        'varying vec2 vTexcoord;' +
        'uniform vec2 uInvFrameSize;' +
        'void main( void ) {' +
        '   gl_Position = vec4( (2.0 * aPosition.xy * uInvFrameSize - 1.0), 0.0, 1.0 );' +
        '   vTexcoord = aTexcoord;' +
        '}';

    private static PixelShaderCode: string =
        'precision mediump float;' +
        'varying vec2 vTexcoord;' +
        'uniform sampler2D tColorTex;' +
        'uniform sampler2D tAlphaTex;' +
        'uniform int bUseAlphaTex;' +
        'void main( void ) {' +
        '   vec4 color = texture2D( tColorTex, vTexcoord );' +
        '   if( bUseAlphaTex == 1 ) {' +
        '       color.a = texture2D( tAlphaTex, vTexcoord ).r;' +
        '   }' +
        '   gl_FragColor = vec4( 1, 0, 0, 1 );' +
        '}';


    //////////////////////////////////////////////////////////////////////////
    // @brief Get vertex shader code for geometry program.
    // @return Vertex shader code.
    public static GetVertexShaderCode(): string {
        return FGeometryShaders.VertexShaderCode;
    };

    //////////////////////////////////////////////////////////////////////////
    // @brief Get pixel (fragment) shader code for geometry program.
    // @return Pixel shader code.
    public static GetPixelShaderCode(): string {
        return FGeometryShaders.PixelShaderCode;
    };
};
