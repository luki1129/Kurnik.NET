﻿import { CObject } from "./object";
import { CContext } from "../rendering/context";
import { ERenderPass } from "../rendering/renderable";
import { FVertex, FInstancedVertexAttribute } from "./vertex";
import { FVector } from "../core/math/vector";
import { FVector2D } from "../core/math/vector2d";
import { CObjectBuilder } from "./object_builder";

export class CInstancedObject<T extends CObject> extends CObject
{
    protected mInstancingSupported: boolean;
    protected mInstanceCount: number;
    protected mInstanceBuffer: WebGLBuffer;
    protected mInstanceBufferData: FInstancedVertexAttribute[];
    protected mInstanceBufferDirty: boolean;
    protected mEmulatedInstances: CObject[];
    protected mEmulatedInstancesBuilder: CObjectBuilder<T>;

    //////////////////////////////////////////////////////////////////////////
    // @brief Create new instanced object. Instanced objects represent group
    //  of object that share the same index and vertex buffers, allowing to
    //  use them more efficiently.
    // @param context [in] WebGL rendering context wrapper instance.
    // @param name [in] Name of the objects group.
    // @param renderFlags [in] When should be the objects rendered.
    // @param objectFactory [in] Object factory, used when instancing is not
    //  supported in current version of WebGL (<2.0).
    public constructor( context: CContext, name: string, renderFlags: number, objectBuilder: CObjectBuilder<T> )
    {
        super( context, name, renderFlags );

        let gl2 = context.GetGL2Context();

        if ( gl2 == null )
        { // WebGL 2.0 not supported, use emulation
            this.mEmulatedInstances = new Array<CObject>();
            this.mEmulatedInstancesBuilder = objectBuilder;
            this.mInstancingSupported = false;
        }
        else
        {
            this.mInstanceBuffer = gl2.createBuffer();
            this.mInstanceBufferData = new Array<FInstancedVertexAttribute>();
            this.mInstanceBufferDirty = true;
            this.mInstancingSupported = true;

            // Obtain single mesh data
            let dummyObject = objectBuilder.Create( context );
            this.mVertexBuffer = dummyObject.GetVertexBuffer();
            this.mIndexBuffer = dummyObject.GetIndexBuffer();
            this.mIndexCount = dummyObject.GetIndexCount();
        }

        this.mInstanceCount = 0;
    };

    //////////////////////////////////////////////////////////////////////////
    // @brief Add new instance to the object group.
    // @param context [in] WebGL rendering context wrapper instance.
    // @param position [in] Position of the new instance.
    // @param texcoord [in] Texture coordinate offset of the new instance.
    public AddInstance( context: CContext, position?: FVector, texcoord?: FVector2D ): void
    {
        if ( this.mInstancingSupported )
        {
            let pos = position;
            if ( pos == null )
                pos = new FVector();

            let tex = texcoord;
            if ( tex == null )
                tex = new FVector2D();

            this.mInstanceBufferData.push(
                new FInstancedVertexAttribute( pos.x, pos.y, pos.z, tex.x, tex.y ) );

            this.mInstanceBufferDirty = true;
        }
        else
        {
            let newObject = this.mEmulatedInstancesBuilder.GetFactory()
                .SetName( this.Name + "_instance" + this.mInstanceCount.toString() )
                .SetRenderFlags( this.mRenderFlags )
                .SetPosition( position )
                .SetTexcoordOffset( texcoord )
                .Create( context );
            
            this.mEmulatedInstances.push( newObject );
        }

        this.mInstanceCount++;
    };

    //////////////////////////////////////////////////////////////////////////
    // @brief Render the object group.
    // @param context [in] Instance of WebGL context wrapper.
    // @param renderPass [in] Type of the current render pass.
    public Render( context: CContext, renderPass: ERenderPass ): void
    {
        let gl2 = context.GetGL2Context();
        if ( gl2 != null )
        {
            if ( this.mInstanceBufferDirty )
            {
                this.UpdateBuffers( context );
            }
            
            FVertex.EnableInputLayout( context, this.mVertexBuffer );
            FInstancedVertexAttribute.EnableInputLayout( context, this.mInstanceBuffer );

            gl2.bindBuffer( gl2.ELEMENT_ARRAY_BUFFER, this.mIndexBuffer );
            
            gl2.drawElementsInstanced(
                gl2.TRIANGLES,
                this.mIndexCount,
                gl2.UNSIGNED_SHORT,
                0,
                this.mInstanceCount );

            FVertex.DisableInputLayout( context );
            FInstancedVertexAttribute.DisableInputLayout( context );
        }
        else
        { // WebGL 2.0 not supported, emulate the instancing
            for ( let instance of this.mEmulatedInstances )
            {
                instance.Render( context, renderPass );
            }
        }
    };

    protected UpdateBuffers( context: CContext ): void
    {
        let gl = context.GetGL2Context();

        let instanceBuffer = new Array<number>( this.mInstanceBufferData.length * FInstancedVertexAttribute.Size() );

        let currentByteOffset = 0;
        for ( let instance of this.mInstanceBufferData )
        {
            instanceBuffer[currentByteOffset + 0] = instance.Position.x;
            instanceBuffer[currentByteOffset + 1] = instance.Position.y;
            instanceBuffer[currentByteOffset + 2] = instance.Position.z;

            instanceBuffer[currentByteOffset + 3] = instance.Texcoord.x;
            instanceBuffer[currentByteOffset + 4] = instance.Texcoord.y;

            currentByteOffset += 5;
        }

        this.mInstanceBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.mInstanceBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( instanceBuffer ), gl.STATIC_DRAW );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
        
        this.mInstanceBufferDirty = false;
    };
};
