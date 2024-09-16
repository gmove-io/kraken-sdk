import {Bag} from "../../_dependencies/source/0x2/bag/structs";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../_framework/util";
import {Auth} from "../auth/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== Executable =============================== */

export function isExecutable(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::executable::Executable`; }

export interface ExecutableFields { auth: ToField<Auth>; nextToDestroy: ToField<"u64">; actions: ToField<Bag> }

export type ExecutableReified = Reified< Executable, ExecutableFields >;

export class Executable implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::executable::Executable`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = Executable.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::executable::Executable`; readonly $typeArgs: []; readonly $isPhantom = Executable.$isPhantom;

 readonly auth: ToField<Auth>; readonly nextToDestroy: ToField<"u64">; readonly actions: ToField<Bag>

 private constructor(typeArgs: [], fields: ExecutableFields, ) { this.$fullTypeName = composeSuiType( Executable.$typeName, ...typeArgs ) as `${typeof PKG_V1}::executable::Executable`; this.$typeArgs = typeArgs;

 this.auth = fields.auth;; this.nextToDestroy = fields.nextToDestroy;; this.actions = fields.actions; }

 static reified( ): ExecutableReified { return { typeName: Executable.$typeName, fullTypeName: composeSuiType( Executable.$typeName, ...[] ) as `${typeof PKG_V1}::executable::Executable`, typeArgs: [ ] as [], isPhantom: Executable.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => Executable.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Executable.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => Executable.fromBcs( data, ), bcs: Executable.bcs, fromJSONField: (field: any) => Executable.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => Executable.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => Executable.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => Executable.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => Executable.fetch( client, id, ), new: ( fields: ExecutableFields, ) => { return new Executable( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return Executable.reified() }

 static phantom( ): PhantomReified<ToTypeStr<Executable>> { return phantom(Executable.reified( )); } static get p() { return Executable.phantom() }

 static get bcs() { return bcs.struct("Executable", {

 auth: Auth.bcs, next_to_destroy: bcs.u64(), actions: Bag.bcs

}) };

 static fromFields( fields: Record<string, any> ): Executable { return Executable.reified( ).new( { auth: decodeFromFields(Auth.reified(), fields.auth), nextToDestroy: decodeFromFields("u64", fields.next_to_destroy), actions: decodeFromFields(Bag.reified(), fields.actions) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): Executable { if (!isExecutable(item.type)) { throw new Error("not a Executable type");

 }

 return Executable.reified( ).new( { auth: decodeFromFieldsWithTypes(Auth.reified(), item.fields.auth), nextToDestroy: decodeFromFieldsWithTypes("u64", item.fields.next_to_destroy), actions: decodeFromFieldsWithTypes(Bag.reified(), item.fields.actions) } ) }

 static fromBcs( data: Uint8Array ): Executable { return Executable.fromFields( Executable.bcs.parse(data) ) }

 toJSONField() { return {

 auth: this.auth.toJSONField(),nextToDestroy: this.nextToDestroy.toString(),actions: this.actions.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): Executable { return Executable.reified( ).new( { auth: decodeFromJSONField(Auth.reified(), field.auth), nextToDestroy: decodeFromJSONField("u64", field.nextToDestroy), actions: decodeFromJSONField(Bag.reified(), field.actions) } ) }

 static fromJSON( json: Record<string, any> ): Executable { if (json.$typeName !== Executable.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return Executable.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): Executable { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isExecutable(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Executable object`); } return Executable.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): Executable { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isExecutable(data.bcs.type)) { throw new Error(`object at is not a Executable object`); }

 return Executable.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Executable.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<Executable> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Executable object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isExecutable(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Executable object`); }

 return Executable.fromSuiObjectData( res.data ); }

 }