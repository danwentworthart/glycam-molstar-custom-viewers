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
            options?.format ?? 'pdb' as any
        );
        const model = await plugin.builders.structure.createModel(trajectory);
        // The co-complex is the structure.
        const structure = await plugin.builders.structure.createStructure(model);
        
        // The co-complex is made up of components, which are the protein and possibly glycans.
        // In the Mol* context, 'polymer' means the protein.
        const protein = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer');
        if (protein?.isOk){
            // Add a representation for the protein.
            await plugin.builders.structure.representation.addRepresentation(structure, {
                type: 'cartoon',
                typeParams: { 
                    alpha: 1.0,
                }
            });
        }

        // Use a query to define the glycans as any components that are not polymers.
        const MS = MolScriptBuilder
        const query =  MS.struct.generator.atomGroups({
            'entity-test': MS.core.rel.neq([MS.ammp('entityType'), 'polymer'])
        });
        const glycans = await plugin.builders.structure.tryCreateComponentFromExpression(structure, query, 'not-polymer');
        
        if (glycans?.isOk){
            // Add a representation for the glycans.
            await plugin.builders.structure.representation.addRepresentation(glycans, {
                type: 'ball-and-stick',
                typeParams: { 
                    alpha: 1.0,
                }
            });

            // In the CB context, 'carbohydrate-terminal-link' connects from the aglycon to the 3dSNFG symbol of 
            // the reducing end sugar. But that looks like an error, so we comment it out. (GP uses this to fix a gap.)
            await plugin.builders.structure.representation.addRepresentation(structure, {
                type: 'carbohydrate',
                typeParams: {
                    alpha: 1.0,
                    sizeFactor: 0.8,
                    linkSizeFactor: 0.0,
                    visuals: [
                        'carbohydrate-symbol', 
                        'carbohydrate-link',
                        'carbohydrate-terminal-link'
                    ]
                }
            });
        }

        // Filling the gap between the protein and glycans.
        // OLS, OLT, or NLN
        const gap_query = MS.struct.generator.atomGroups({
            'residue-test': MS.core.logic.or([
                MS.core.rel.eq([MS.ammp('label_comp_id'), 'OLS']),
                MS.core.rel.eq([MS.ammp('label_comp_id'), 'OLT']),
                MS.core.rel.eq([MS.ammp('label_comp_id'), 'NLN'])
            ])
        });
        const gap = await plugin.builders.structure.tryCreateComponentFromExpression(structure, gap_query, 'gap');

        if (gap?.isOk){
            // Add a representation for the gap.
            await plugin.builders.structure.representation.addRepresentation(gap, {
                type: 'ball-and-stick',
                typeParams: { 
                    alpha: 1.0,
                }
            });
        }

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

