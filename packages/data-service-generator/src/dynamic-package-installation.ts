import { PluginInstallation } from "@amplication/code-gen-types";
import { join } from "path";
import { AMPLICATION_MODULES } from "./generate-code";
import {
  DynamicPackageInstallationManager,
  PackageInstallation,
} from "./utils/dynamic-installation/DynamicPackageInstallationManager";
import { ILogger } from "@amplication/util/logging";
import DsgContext from "./dsg-context";

export async function dynamicPackagesInstallations(
  packages: PluginInstallation[],
  logger: ILogger
): Promise<void> {
  logger.info("Installing dynamic packages");

  const context = DsgContext.getInstance;

  const manager = new DynamicPackageInstallationManager(
    join(__dirname, "..", AMPLICATION_MODULES),
    context.logger
  );

  for (const plugins of packages) {
    const plugin: PackageInstallation = {
      name: plugins.npm,
      version: plugins.version,
    };
    await manager.install(plugin, {
      onBeforeInstall: async (plugin) => {
        await context.logger.info(
          `Installing Plugin: ${plugin.name}@${plugin.version}`
        );
      },
      onAfterInstall: async (plugin) => {
        await context.logger.info(
          `Successfully Installed plugin: ${plugin.name}@${plugin.version}`
        );
      },
      onError: async (plugin, error) => {
        await context.logger.error(
          `Failed to installed plugin: ${plugin.name}@${plugin.version}`,
          { ...error }
        );
      },
    });
  }

  return;
}
