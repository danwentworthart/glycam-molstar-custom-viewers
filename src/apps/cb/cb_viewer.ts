import { DefaultPluginSpec, PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { PluginConfigItem } from 'molstar/lib/mol-plugin/config';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { SaccharideCompIdMapType } from 'molstar/lib/mol-model/structure/structure/carbohydrates/constants';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';

export async function initViewer(element: string | HTMLDivElement, options?: { spec?: PluginSpec }) {
    try{
        console.log("Mol* viewer for GlycamWeb.");
        const parent = typeof element === 'string' ? document.getElementById(element)! as HTMLDivElement : element;
        const canvas = document.createElement('canvas') as HTMLCanvasElement;
        parent.appendChild(canvas);
        const defaultSpec = DefaultPluginSpec();
        const spec : PluginUISpec = {
            behaviors: defaultSpec.behaviors,
            config: [
                [PluginConfig.Structure.SaccharideCompIdMapType, 'glycam']
            ]
        };
        const plugin = new PluginContext(spec);
        await plugin.init();
        plugin.initViewer(canvas, parent);
        return plugin;
    }
    catch(e){
        console.error('Error initializing viewer.', e);
    }
}

export async function loadStructure(
    plugin: PluginContext,
    url: string,
    options?: { format?: string, isBinary?: boolean }
) {
    try{
        console.log(`glycam_molstar.js is loading structure: ${url}`);
        console.log(`   with options: ${JSON.stringify(options)}`);
        
        const data = await plugin.builders.data.download(
            { url, isBinary: options?.isBinary }
        );
        const trajectory = await plugin.builders.structure.parseTrajectory(
            data,
            options?.format ?? "pdb" as any
        );
        const model = await plugin.builders.structure.createModel(trajectory);
        const structure = await plugin.builders.structure.createStructure(model, { name: "model", params: {} });
        await plugin.builders.structure.representation.addRepresentation(structure, {
            type: "ball-and-stick",
            typeParams: {
                alpha: 1
            }
        });
        await plugin.builders.structure.representation.addRepresentation(structure, {
            type: "carbohydrate",
            typeParams: {
                alpha: 1,
                sizeFactor: 0.8,
                linkSizeFactor: 0,
                visuals: [
                    "carbohydrate-symbol",
                    "carbohydrate-link"
                    // 'carbohydrate-terminal-link'
                ]
            }
        }); 
    }
    catch(error){
        if (error instanceof Response && error.status === 404){
            console.error("404, not found.");
            const div = document.querySelector("#glycam_molstar_viewer");
            if (div){
                div.innerHTML = error.statusText;
            }
        }
        else{
            console.error('Error loading structure.', error);
        }
    }
}